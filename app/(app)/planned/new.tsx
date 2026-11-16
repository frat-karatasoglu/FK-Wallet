import { useRouter } from 'expo-router';
import { useRedirectIfLocked } from '@/src/store/useSubscriptionStore';

import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import { PlannedPaymentForm } from '@/src/components/PlannedPaymentForm';
import type { NewPlannedPayment } from '@/src/types/database';

export default function NewPlannedPaymentScreen() {
  useRedirectIfLocked();
  const router = useRouter();
  const addPlannedPayment = usePlannedPaymentsStore((s) => s.addPlannedPayment);

  async function handleSubmit(values: NewPlannedPayment) {
    const message = await addPlannedPayment(values);
    if (!message) router.back();
    return message;
  }

  return <PlannedPaymentForm submitLabel="Ödemeyi Kaydet" onSubmit={handleSubmit} />;
}
