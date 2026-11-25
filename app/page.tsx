import { Hero } from "@/components/home/Hero";
import { CredibilityStrip } from "@/components/home/CredibilityStrip";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { Problems } from "@/components/home/Problems";
import { ControlMechanism } from "@/components/home/ControlMechanism";
import { WorkflowProof } from "@/components/home/WorkflowProof";
import { FinanceLayers } from "@/components/home/FinanceLayers";
import { UseCases } from "@/components/home/UseCases";
import { TrustSection } from "@/components/home/TrustSection";
import { PrivateBeta } from "@/components/home/PrivateBeta";
import { CtaBand } from "@/components/home/CtaBand";
import { Faq } from "@/components/Faq";
import { getContent } from "@/lib/content";

export default async function Home() {
  const c = await getContent();
  return (
    <>
      <Hero hero={c.home.hero} />
      <CredibilityStrip />
      <ProductShowcase showcase={c.home.showcase} />
      <Problems />
      <ControlMechanism />
      <WorkflowProof />
      <FinanceLayers />
      <UseCases />
      <TrustSection />
      <PrivateBeta />
      <CtaBand />
      <Faq faq={c.shared.faq} email={c.shared.contact.email} enquiriesLabel={c.shared.contact.enquiriesLabel} />
    </>
  );
}
