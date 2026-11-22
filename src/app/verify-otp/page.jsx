import { Suspense } from "react";
import VerifyOTP from "../../views/VerifyOTP";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyOTP />
    </Suspense>
  );
}
