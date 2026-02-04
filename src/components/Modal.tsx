import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  type ModalProps,
} from "react-native";
import { colors, shadows, borderRadius } from "../theme";

interface ModalComponentProps extends Omit<ModalProps, "children"> {
  visible: boolean;
  /** Called when backdrop or close button is pressed. If undefined, modal cannot be dismissed by backdrop tap. */
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  ...props
}: ModalComponentProps) {
  const handleClose = onClose ?? (() => {});
  const canDismiss = !!onClose;
  
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      {...props}
    >
      <TouchableOpacity
        className="flex-1 justify-center items-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        activeOpacity={1}
        onPress={canDismiss ? onClose : undefined}
        disabled={!canDismiss}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.xl,
            padding: 24,
            maxWidth: 400,
            width: "100%",
            ...shadows.extruded.large,
            borderWidth: 2,
            borderColor: colors.gold.dark,
          }}
        >
          {title && (
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.gold.primary,
                marginBottom: 16,
              }}
            >
              {title}
            </Text>
          )}
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}
