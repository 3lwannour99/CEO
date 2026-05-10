"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import { useI18n } from "@/i18n/useI18n";
import styles from "./login.module.css";

export default function LoginPage() {
  const { languageMeta, t } = useI18n();
  const auth = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [auth.isAuthenticated, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError(t("auth.requiredUsername"));
      return;
    }

    if (!password) {
      setError(t("auth.requiredPassword"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await auth.login(trimmedUsername, password);
      router.replace("/dashboard");
    } catch (loginError) {
      if (process.env.NODE_ENV === "development") {
        console.error(loginError);
      }

      if (loginError instanceof ApiError && (loginError.status === 401 || loginError.status === 403)) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(t("auth.loginFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page} dir={languageMeta.direction}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.toolbar}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className={styles.brandRow}>
          <span className={styles.logoMark}>CR</span>
          <div>
            <p className={styles.kicker}>CEOReport</p>
            <h1 id="login-title">{t("auth.welcomeBack")}</h1>
          </div>
        </div>
        <p className={styles.title}>{t("auth.loginTitle")}</p>
        <p className={styles.description}>{t("auth.loginDescription")}</p>
        <form className={styles.form} onSubmit={submit} noValidate>
          <label className={styles.field}>
            <span>{t("auth.username")}</span>
            <input
              autoComplete="username"
              dir="ltr"
              inputMode="text"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(error) && !username.trim()}
            />
          </label>
          <label className={styles.field}>
            <span>{t("auth.password")}</span>
            <input
              autoComplete="current-password"
              dir="ltr"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error) && !password}
            />
          </label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.submit} type="submit" disabled={isSubmitting || auth.isLoading}>
            {isSubmitting ? t("auth.loggingIn") : t("auth.accessDashboard")}
          </button>
        </form>
        {process.env.NODE_ENV === "development" ? (
          <p className={styles.devNote}>{t("auth.adminCredentialsNote")}</p>
        ) : null}
      </section>
    </main>
  );
}
