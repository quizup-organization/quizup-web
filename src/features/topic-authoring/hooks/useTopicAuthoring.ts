import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { topicsService } from "@/features/topics";
import type {
  CreateTopicInput,
  QuestionEditor,
  TopicPatch,
} from "../domain/topic-authoring";
import {
  buildQuestionPlan,
  toCreateInput,
  type QuestionDraft,
} from "../lib/question-draft";
import { topicAuthoringService } from "../lib/topic-authoring";

/** Délai avant réconciliation : les projections Axon sont en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

/** Sujets créés par le joueur courant (brouillons + publiés, plus récents d'abord). */
export function useMyTopics(page = 0, size = 50) {
  return useQuery({
    queryKey: queryKeys.topics.mine({ page, size }),
    queryFn: () => topicsService.list({ mine: true, page, size }),
  });
}

/** Questions d'un sujet en gestion : tous statuts, contenus localisés. */
export function useTopicQuestions(topicId: string, page = 0, size = 100) {
  return useQuery({
    queryKey: queryKeys.topics.questions(topicId, { page, size }),
    queryFn: () => topicAuthoringService.questions(topicId, { page, size }),
    enabled: Boolean(topicId),
  });
}

function invalidateTopicViews(queryClient: ReturnType<typeof useQueryClient>) {
  window.setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.home() });
  }, RECONCILE_DELAY_MS);
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTopicInput) => topicAuthoringService.createTopic(input),
    onSuccess: () => {
      invalidateTopicViews(queryClient);
    },
  });
}

/** Patch du sujet : seuls les champs fournis partent (une commande par champ). */
export function useUpdateTopic(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: TopicPatch) => {
      await Promise.all([
        ...(patch.nameUpdates ?? []).map((update) =>
          topicAuthoringService.updateName(topicId, update.language, update.name),
        ),
        patch.description !== undefined
          ? topicAuthoringService.updateDescription(topicId, patch.description)
          : Promise.resolve(),
        patch.category !== undefined
          ? topicAuthoringService.updateCategory(topicId, patch.category)
          : Promise.resolve(),
        patch.emoji !== undefined
          ? topicAuthoringService.updateEmoji(topicId, patch.emoji)
          : Promise.resolve(),
        patch.color !== undefined
          ? topicAuthoringService.updateColor(topicId, patch.color)
          : Promise.resolve(),
        patch.imageUrl !== undefined
          ? topicAuthoringService.updateImageUrl(topicId, patch.imageUrl)
          : Promise.resolve(),
      ]);
    },
    onSuccess: () => {
      toast.success("Sujet mis à jour");
      invalidateTopicViews(queryClient);
    },
  });
}

export function usePublishTopic(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => topicAuthoringService.publish(topicId),
    onSuccess: () => {
      toast.success("Sujet publié");
      invalidateTopicViews(queryClient);
    },
  });
}

/**
 * Enregistre une question : création complète, ou plan d'opérations par champ (seuls les champs
 * modifiés partent) pour une question existante.
 */
export function useSaveQuestion(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      question: QuestionEditor | null;
      draft: QuestionDraft;
    }) => {
      if (!input.question) {
        await topicAuthoringService.createQuestion(topicId, toCreateInput(input.draft));
        return;
      }

      for (const operation of buildQuestionPlan(input.question, input.draft)) {
        switch (operation.kind) {
          case "create":
            await topicAuthoringService.createQuestion(topicId, operation.payload);
            break;
          case "translation":
            await topicAuthoringService.addTranslation(
              input.question.questionId,
              operation.language,
              operation.text,
              operation.answers,
            );
            break;
          case "text":
            await topicAuthoringService.updateText(
              input.question.questionId,
              operation.language,
              operation.text,
            );
            break;
          case "answers":
            await topicAuthoringService.updateAnswers(
              input.question.questionId,
              operation.language,
              operation.answers,
            );
            break;
          case "correctAnswer":
            await topicAuthoringService.updateCorrectAnswer(
              input.question.questionId,
              operation.correctAnswer,
            );
            break;
          case "imageUrl":
            await topicAuthoringService.updateQuestionImageUrl(
              input.question.questionId,
              operation.imageUrl,
            );
            break;
        }
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.question ? "Question mise à jour" : "Question ajoutée");
      invalidateTopicViews(queryClient);
    },
  });
}

export function useModerateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      questionId: string;
      action: "approve" | "reject";
      reason?: string;
    }) => {
      if (input.action === "approve") {
        await topicAuthoringService.approve(input.questionId);
      } else {
        await topicAuthoringService.reject(input.questionId, input.reason);
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "approve" ? "Question approuvée" : "Question rejetée",
      );
      invalidateTopicViews(queryClient);
    },
  });
}
