import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Share2, Sparkles, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeConfig } from "@/theme/ThemeProvider";

const featureIcons = [Sparkles, Trees, Share2, BookOpen] as const;

export function LandingPage() {
  const { labels } = useThemeConfig();
  const { landing } = labels;

  const features = [
    { title: landing.feature1Title, description: landing.feature1Description },
    { title: landing.feature2Title, description: landing.feature2Description },
    { title: landing.feature3Title, description: landing.feature3Description },
    { title: landing.feature4Title, description: landing.feature4Description },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <section className="text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent-muted)]">
          {landing.eyebrow}
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold leading-tight text-[var(--color-foreground)] sm:text-5xl">
          {landing.headline}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--color-muted)] sm:text-lg">
          {landing.description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="default" className="min-w-[180px]">
            <Link to="/planner">
              {landing.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-[var(--color-muted)]">{landing.ctaHint}</p>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = featureIcons[index] ?? Sparkles;
          return (
            <Card key={feature.title} className="border-[var(--color-border)]/80">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
