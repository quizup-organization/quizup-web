import { useTranslation } from "react-i18next"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import { FormRow } from "@/shared/components/form-section"
import { playNotificationSound } from "../lib/notification-sound"
import { useNotificationSoundStore } from "../stores/useNotificationSoundStore"

export function NotificationSoundSetting() {
  const { t } = useTranslation()
  const enabled = useNotificationSoundStore((state) => state.enabled)
  const setEnabled = useNotificationSoundStore((state) => state.setEnabled)

  const onToggle = (checked: boolean) => {
    setEnabled(checked)
    if (checked) playNotificationSound()
  }

  return (
    <FormRow
      label={t("notifications.sound.label")}
      description={t("notifications.sound.description")}
      controlClassName="flex tablet-up:justify-end"
    >
      <AnimatedSwitch
        label={t("notifications.sound.label")}
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </FormRow>
  )
}
