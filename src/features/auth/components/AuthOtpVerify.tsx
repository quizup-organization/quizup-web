import { Loader2, Mail, MessageSquare, Phone, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Description,
  InputOTP,
  Label,
  ListBox,
  REGEXP_ONLY_DIGITS,
  Select,
} from "@heroui/react";
import { cn } from "@/lib/utils";

export type OTPDeliveryMethod = "email" | "sms" | "whatsapp";

export interface AuthOtpVerifyProps {
  deliveryMethod?: OTPDeliveryMethod;
  deliveryAddress?: string;
  onDeliveryMethodChange?: (method: OTPDeliveryMethod) => void;
  onSubmit?: (code: string) => void;
  onResend?: (method: OTPDeliveryMethod) => void;
  className?: string;
  isLoading?: boolean;
  resendCooldown?: number;
  errors?: {
    code?: string;
    general?: string;
  };
  autoSubmit?: boolean;
  codeLength?: number;
  availableMethods?: OTPDeliveryMethod[];
}

const DELIVERY_METHOD_CONFIG: Record<
  OTPDeliveryMethod,
  { label: string; title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  email: {
    label: "Email",
    title: "Vérifie ta boîte mail",
    icon: Mail,
  },
  sms: {
    label: "SMS",
    title: "Vérifie tes SMS",
    icon: MessageSquare,
  },
  whatsapp: {
    label: "WhatsApp",
    title: "Vérifie WhatsApp",
    icon: Phone,
  },
};

function formatDeliveryAddress(
  address: string | undefined,
  method: OTPDeliveryMethod
): string {
  if (!address) return "";
  if (method === "email") return address;
  if (address.length > 4) {
    const visible = address.slice(-4);
    const masked = "*".repeat(address.length - 4);
    return `${masked}${visible}`;
  }
  return address;
}

interface DeliveryMethodSelectProps {
  availableMethods: OTPDeliveryMethod[];
  deliveryMethod: OTPDeliveryMethod;
  onDeliveryMethodChange: (method: OTPDeliveryMethod) => void;
}

function DeliveryMethodSelect({
  availableMethods,
  deliveryMethod,
  onDeliveryMethodChange,
}: DeliveryMethodSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Moyen de réception</Label>
      <Select
        value={deliveryMethod}
        onChange={(key) =>
          onDeliveryMethodChange(key as OTPDeliveryMethod)
        }
      >
        <Select.Trigger className="w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {availableMethods.map((method) => {
              const config = DELIVERY_METHOD_CONFIG[method];
              const Icon = config.icon;
              return (
                <ListBox.Item
                  key={method}
                  id={method}
                  textValue={config.label}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <Label>{config.label}</Label>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              );
            })}
          </ListBox>
        </Select.Popover>
      </Select>
      <Description>Choisis comment recevoir le code de connexion</Description>
    </div>
  );
}

interface ResendButtonProps {
  cooldown: number;
  isLoading: boolean;
  onClick: () => void;
}

function ResendButton({ cooldown, isLoading, onClick }: ResendButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      isDisabled={cooldown > 0 || isLoading}
      onPress={onClick}
    >
      {cooldown > 0 ? (
        `Renvoyer dans ${cooldown}s`
      ) : (
        <span className="flex items-center gap-1">
          <RefreshCw aria-hidden="true" className="size-3" />
          Renvoyer le code
        </span>
      )}
    </Button>
  );
}

interface OTPFieldProps {
  code: string;
  codeError?: string;
  codeLength: number;
  isLoading: boolean;
  onCodeChange: (code: string) => void;
  onResend?: () => void;
  resendCooldown: number;
}

function OTPField({
  code,
  codeError,
  codeLength,
  isLoading,
  onCodeChange,
  onResend,
  resendCooldown,
}: OTPFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="otp-code" isRequired>
        Code de connexion
      </Label>
      <InputOTP
        aria-describedby={codeError ? "otp-code-error" : undefined}
        isInvalid={!!codeError}
        isDisabled={isLoading}
        id="otp-code"
        maxLength={codeLength}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        onChange={onCodeChange}
        value={code}
      >
        <InputOTP.Group>
          {Array.from({ length: codeLength }).map((_, index) => (
            <InputOTP.Slot index={index} key={index} />
          ))}
        </InputOTP.Group>
      </InputOTP>
      {codeError && (
        <p id="otp-code-error" className="text-sm text-danger">
          {codeError}
        </p>
      )}
      <div className="flex flex-col gap-2 text-muted text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>Saisis le code à {codeLength} chiffres</span>
        {onResend && (
          <ResendButton
            cooldown={resendCooldown}
            isLoading={isLoading}
            onClick={onResend}
          />
        )}
      </div>
    </div>
  );
}

interface VerifyButtonProps {
  code: string;
  codeLength: number;
  isLoading: boolean;
  onSubmit: (code: string) => void;
}

function VerifyButton({
  code,
  codeLength,
  isLoading,
  onSubmit,
}: VerifyButtonProps) {
  return (
    <Button
      fullWidth
      isPending={isLoading}
      isDisabled={isLoading || code.length !== codeLength}
      onPress={() => onSubmit(code)}
      type="button"
      className="min-h-[44px] touch-manipulation"
    >
      {isLoading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Vérification…
        </>
      ) : (
        "Se connecter"
      )}
    </Button>
  );
}

export function AuthOtpVerify({
  deliveryMethod = "email",
  deliveryAddress,
  onDeliveryMethodChange,
  onSubmit,
  onResend,
  className,
  isLoading = false,
  resendCooldown = 60,
  errors,
  autoSubmit = true,
  codeLength = 6,
  availableMethods = ["email", "sms"],
}: AuthOtpVerifyProps) {
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (autoSubmit && code.length === codeLength && !isLoading) {
      onSubmit?.(code);
    }
  }, [code, autoSubmit, isLoading, codeLength, onSubmit]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    await onResend?.(deliveryMethod);
    setCooldown(resendCooldown);
  }, [cooldown, onResend, deliveryMethod, resendCooldown]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const codeError = errors?.code;
  const generalError = errors?.general;
  const methodConfig = DELIVERY_METHOD_CONFIG[deliveryMethod];
  const formattedAddress = formatDeliveryAddress(
    deliveryAddress,
    deliveryMethod
  );

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          {methodConfig.title}
        </Card.Title>
        <Card.Description>
          Un code à {codeLength} chiffres a été envoyé à{" "}
          {deliveryAddress ? (
            <span className="font-medium">{formattedAddress}</span>
          ) : (
            "ton " + methodConfig.label.toLowerCase()
          )}
          .
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-6">
          {generalError && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{generalError}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {availableMethods.length > 1 && onDeliveryMethodChange && (
            <DeliveryMethodSelect
              availableMethods={availableMethods}
              deliveryMethod={deliveryMethod}
              onDeliveryMethodChange={onDeliveryMethodChange}
            />
          )}

          <OTPField
            code={code}
            codeError={codeError}
            codeLength={codeLength}
            isLoading={isLoading}
            onCodeChange={handleCodeChange}
            onResend={onResend ? handleResend : undefined}
            resendCooldown={cooldown}
          />

          {!autoSubmit && (
            <VerifyButton
              code={code}
              codeLength={codeLength}
              isLoading={isLoading}
              onSubmit={onSubmit || (() => {})}
            />
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
