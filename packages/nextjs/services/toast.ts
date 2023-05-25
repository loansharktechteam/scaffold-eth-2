import toast from "react-hot-toast";

export function error(msg: string) {
  if (msg === "User rejected request") {
    return;
  }
  toast.error(msg);
}

export function success(msg: string) {
  toast.success(msg);
}
