import { getTranslations } from "next-intl/server";
import { FAQ_ITEMS } from "@/lib/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";

export async function Faq() {
  const t = await getTranslations("faq");

  return (
    <Section id="faq" labelledBy="faq-title">
      <div className="mx-auto max-w-3xl">
        <SectionHeading id="faq-title" eyebrow={t("eyebrow")} title={t("title")} align="center" />
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-10 flex flex-col gap-3.5">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item} value={item}>
                <AccordionTrigger>{t(`items.${item}.q`)}</AccordionTrigger>
                <AccordionContent>{t(`items.${item}.a`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
