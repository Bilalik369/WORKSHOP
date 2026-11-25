import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tCommon = await getTranslations("common");

  return (
    <PageShell>
      <div className="glass mx-auto flex max-w-xl flex-col items-center rounded-3xl px-6 py-14 text-center">
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center rounded-full border-[1.5px] border-azure/50 bg-white text-navy"
        >
          <Compass className="size-7" strokeWidth={1.6} />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-3 text-lg">{t("text")}</p>
        <Button asChild className="mt-8">
          <Link href="/">{tCommon("backHome")}</Link>
        </Button>
      </div>
    </PageShell>
  );
}
