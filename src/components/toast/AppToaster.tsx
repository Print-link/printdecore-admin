import toast, { resolveValue, useToaster, type ToastType } from "react-hot-toast";
import { ToastStack, type StackToastType } from "./ToastStack";

const TYPE: Record<ToastType, StackToastType> = {
	success: "success",
	error: "error",
	loading: "loading",
	blank: "default",
	custom: "default",
};

/**
 * react-hot-toast keeps the list and timers (toast.success(...) etc. work as
 * before); this draws it as the shared Printdecore toast stack.
 */
export function AppToaster() {
	const { toasts, handlers } = useToaster({ duration: 3000, error: { duration: 5000 } });

	return (
		<ToastStack
			toasts={toasts.map((t) => ({
				id: t.id,
				type: TYPE[t.type],
				message: resolveValue(t.message, t),
				duration: t.duration ?? 3000,
				visible: t.visible,
				icon: typeof t.icon === "string" ? t.icon : undefined,
			}))}
			onDismiss={(id) => toast.dismiss(id)}
			onHoverChange={(on) => (on ? handlers.startPause() : handlers.endPause())}
		/>
	);
}
