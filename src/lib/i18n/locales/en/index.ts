import type { Resources } from "../fr"
import { authoring } from "./authoring"
import { auth } from "./auth"
import { avatar } from "./avatar"
import { common } from "./common"
import { game } from "./game"
import { home } from "./home"
import { notifications } from "./notifications"
import { people } from "./people"
import { player } from "./player"
import { shared } from "./shared"
import { shell } from "./shell"
import { topic } from "./topic"
import { topics } from "./topics"

/** Catalogue anglais, contraint par la structure du catalogue `fr`. */
export const en: Resources = {
  common,
  shell,
  auth,
  home,
  topics,
  topic,
  people,
  player,
  notifications,
  game,
  authoring,
  avatar,
  shared,
}
