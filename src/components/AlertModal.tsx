import { View, Text } from "react-native";
import Modal from "./Modal";
import Button from "./Button";
import { colors } from "../theme";

export type AlertType = "error" | "info" | "success" | "warning";

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onOk: () => void;
  okText?: string;
  /** Optional cancel button - if provided, shows two buttons */
  onCancel?: () => void;
  cancelText?: string;
}

const TYPE_COLORS: Record<AlertType, string> = {
  error: colors.state.error,
  info: colors.gold.primary,
  success: colors.state.success,
  warning: colors.state.warning,
};

const TYPE_ICONS: Record<AlertType, string> = {
  error: "⚠️",
  info: "ℹ️",
  success: "✓",
  warning: "⚠",
};

export default function AlertModal({
  visible,
  title,
  message,
  type = "info",
  onOk,
  okText = "OK",
  onCancel,
  cancelText = "Cancel",
}: AlertModalProps) {
  const accentColor = TYPE_COLORS[type];
  const icon = TYPE_ICONS[type];

  return (
    <Modal visible={visible} title={title}>
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 15,
              lineHeight: 22,
              flex: 1,
            }}
          >
            {message}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: onCancel ? "row" : "column", gap: 12 }}>
        {onCancel && (
          <View style={{ flex: 1 }}>
            <Button title={cancelText} variant="outline" onPress={onCancel} />
          </View>
        )}
        <View style={{ flex: onCancel ? 1 : undefined }}>
          <Button title={okText} variant="primary" onPress={onOk} />
        </View>
      </View>
    </Modal>
  );
}
