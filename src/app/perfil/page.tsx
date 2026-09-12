"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";
import Sidebar from "@/components/sidebar";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  two_factor_enabled: boolean;
};

type MfaFactor = {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: "verified" | "unverified";
};

export default function PerfilPage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // =========================
  // WHATSAPP
  // =========================

  const [whatsappLoading, setWhatsappLoading] =
    useState(false);

  const [whatsappCode, setWhatsappCode] =
    useState<string | null>(null);

  const [whatsappExpiresAt, setWhatsappExpiresAt] =
    useState<string | null>(null);

  const [whatsappCopied, setWhatsappCopied] =
    useState(false);

  const [whatsappPhone, setWhatsappPhone] =
    useState<string | null>(null);

  const [whatsappSecondsLeft, setWhatsappSecondsLeft] =
    useState(0);

  const [whatsappChecking, setWhatsappChecking] =
    useState(false);

  const [whatsappLinkingStarted, setWhatsappLinkingStarted] =
    useState(false);

  const whatsappGeneratingRef =
    useRef(false);

  // =========================
  // MFA / 2FA
  // =========================

  const [mfaLoading, setMfaLoading] =
    useState(false);

  const [mfaFactor, setMfaFactor] =
    useState<MfaFactor | null>(null);

  const [mfaQrCode, setMfaQrCode] =
    useState<string | null>(null);

  const [mfaSecret, setMfaSecret] =
    useState<string | null>(null);

  const [mfaChallengeId, setMfaChallengeId] =
    useState<string | null>(null);

  const [mfaCode, setMfaCode] =
    useState("");

  const [showMfaSetup, setShowMfaSetup] =
    useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (
      whatsappPhone ||
      !whatsappLinkingStarted ||
      !whatsappCode ||
      !whatsappExpiresAt
    ) {
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(
        whatsappExpiresAt
      ).getTime();

      const seconds = Math.max(
        0,
        Math.ceil(
          (expiresAt - Date.now()) / 1000
        )
      );

      setWhatsappSecondsLeft(seconds);

      if (seconds === 0) {
        setWhatsappCode(null);
        setWhatsappExpiresAt(null);
        void generateWhatsAppCode();
      }
    };

    updateCountdown();

    const interval = window.setInterval(
      updateCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    whatsappCode,
    whatsappExpiresAt,
    whatsappPhone,
    whatsappLinkingStarted,
  ]);

  // Solo comprobamos periódicamente mientras el usuario está intentando vincular.
  // Al entrar al perfil NO hacemos polling infinito.
  useEffect(() => {
    if (
      whatsappPhone ||
      !whatsappLinkingStarted ||
      !whatsappCode
    ) {
      return;
    }

    const checkConnection = () => {
      void loadWhatsAppConnection();
    };

    checkConnection();

    const interval = window.setInterval(
      checkConnection,
      3000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    whatsappPhone,
    whatsappLinkingStarted,
    whatsappCode,
  ]);

  // =========================
  // CARGAR PERFIL
  // =========================

  async function loadProfile() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError(
        "No hay una sesión iniciada."
      );
      setLoading(false);
      return;
    }

    const {
      data,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, avatar_url, two_factor_enabled"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      setError(
        `No se pudo cargar el perfil: ${profileError.message}`
      );
      setLoading(false);
      return;
    }

    setProfile(data);

    setName(
      data.full_name ?? ""
    );

    setEmail(
      data.email ??
        user.email ??
        ""
    );

    // =========================
    // AVATAR
    // =========================

    if (data.avatar_url) {
      if (
        data.avatar_url.startsWith(
          "http"
        )
      ) {
        setAvatarPreview(
          data.avatar_url
        );
      } else {
        const {
          data: signedData,
          error: signedError,
        } =
          await supabase.storage
            .from("avatars")
            .createSignedUrl(
              data.avatar_url,
              60 * 60
            );

        if (
          !signedError &&
          signedData?.signedUrl
        ) {
          setAvatarPreview(
            signedData.signedUrl
          );
        } else {
          setAvatarPreview(null);
        }
      }
    } else {
      setAvatarPreview(null);
    }

    // =========================
    // WHATSAPP
    // =========================

    const connectedPhone =
      await loadWhatsAppConnection();

    if (!connectedPhone) {
      setWhatsappLinkingStarted(false);
    }

    // =========================
    // ESTADO MFA
    // =========================

    await loadMfaStatus();

    setLoading(false);
  }

  async function loadMfaStatus() {
    const {
      data,
      error: factorsError,
    } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error(
        "Error cargando factores MFA:",
        factorsError
      );
      return;
    }

    const verifiedFactor =
      data?.totp?.find(
        (factor) =>
          String(factor.status) ===
          "verified"
      );

    const unverifiedFactor =
      data?.totp?.find(
        (factor) =>
          String(factor.status) ===
          "unverified"
      );

    const activeFactor =
      verifiedFactor ??
      unverifiedFactor ??
      null;

    if (activeFactor) {
      setMfaFactor({
        id: activeFactor.id,
        friendly_name:
          activeFactor.friendly_name ??
          "HormiGUITA",
        factor_type:
          activeFactor.factor_type,
        status:
          String(
            activeFactor.status
          ) === "verified"
            ? "verified"
            : "unverified",
      });
    } else {
      setMfaFactor(null);
    }

    const {
      data: userData,
    } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        two_factor_enabled:
          !!verifiedFactor,
      })
      .eq("id", user.id);

    setProfile((current) =>
      current
        ? {
            ...current,
            two_factor_enabled:
              !!verifiedFactor,
          }
        : current
    );
  }

  // =========================
  // GUARDAR PERFIL
  // =========================

  async function saveProfile(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError(
        "El nombre no puede estar vacío."
      );
      return;
    }

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setError(
        "Tu sesión expiró."
      );
      return;
    }

    setSavingProfile(true);

    const {
      data,
      error: updateError,
    } =
      await supabase
        .from("profiles")
        .update({
          full_name:
            name.trim(),
        })
        .eq("id", user.id)
        .select(
          "id, full_name, email, avatar_url, two_factor_enabled"
        )
        .single();

    if (updateError) {
      setError(
        `No se pudo actualizar el perfil: ${updateError.message}`
      );
      setSavingProfile(false);
      return;
    }

    setProfile(data);

    setName(
      data.full_name ?? ""
    );

    setMessage(
      "Perfil actualizado correctamente."
    );

    setSavingProfile(false);
  }

  // =========================
  // CAMBIAR CONTRASEÑA
  // =========================

  async function changePassword(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      newPassword.length < 8
    ) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    setSavingPassword(true);

    const {
      error: passwordError,
    } =
      await supabase.auth.updateUser(
        {
          password:
            newPassword,
        }
      );

    if (passwordError) {
      setError(
        `No se pudo cambiar la contraseña: ${passwordError.message}`
      );
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setMessage(
      "Contraseña actualizada correctamente."
    );

    setSavingPassword(false);
  }

  // =========================
  // CAMBIAR AVATAR
  // =========================

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Solo se permiten imágenes JPG, PNG o WEBP."
      );
      event.target.value = "";
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setError(
        "La imagen no puede superar los 2 MB."
      );
      event.target.value = "";
      return;
    }

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      setError(
        "Tu sesión expiró. Volvé a iniciar sesión."
      );
      event.target.value = "";
      return;
    }

    setUploadingAvatar(true);

    const oldAvatarPath =
      profile?.avatar_url ??
      null;

    let extension = "jpg";

    if (
      file.type ===
      "image/png"
    ) {
      extension = "png";
    } else if (
      file.type ===
      "image/webp"
    ) {
      extension = "webp";
    }

    const filePath =
      `${user.id}/avatar-${Date.now()}.${extension}`;

    const previewUrl =
      URL.createObjectURL(file);

    setAvatarPreview(
      previewUrl
    );

    // 1. Subir nueva foto

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("avatars")
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",
            upsert: false,
            contentType:
              file.type,
          }
        );

    if (uploadError) {
      URL.revokeObjectURL(
        previewUrl
      );

      setError(
        `No se pudo subir la foto: ${uploadError.message}`
      );

      setUploadingAvatar(
        false
      );

      event.target.value = "";
      return;
    }

    // 2. Guardar nueva ruta

    const {
      error: updateError,
    } =
      await supabase
        .from("profiles")
        .update({
          avatar_url:
            filePath,
        })
        .eq(
          "id",
          user.id
        );

    if (updateError) {
      await supabase.storage
        .from("avatars")
        .remove([
          filePath,
        ]);

      URL.revokeObjectURL(
        previewUrl
      );

      setError(
        `La foto se subió, pero no se pudo guardar el perfil: ${updateError.message}`
      );

      setUploadingAvatar(
        false
      );

      event.target.value = "";
      return;
    }

    // 3. Crear URL firmada

    const {
      data: signedData,
      error: signedError,
    } =
      await supabase.storage
        .from("avatars")
        .createSignedUrl(
          filePath,
          60 * 60
        );

    if (
      signedError ||
      !signedData?.signedUrl
    ) {
      setError(
        "La foto se guardó, pero no se pudo generar la vista previa."
      );

      setUploadingAvatar(
        false
      );

      event.target.value = "";
      return;
    }

    setAvatarPreview(
      signedData.signedUrl
    );

    // 4. Actualizar estado

    setProfile((current) =>
      current
        ? {
            ...current,
            avatar_url:
              filePath,
          }
        : current
    );

    // 5. Eliminar foto anterior

    if (
      oldAvatarPath &&
      !oldAvatarPath.startsWith(
        "http"
      ) &&
      oldAvatarPath !==
        filePath
    ) {
      const {
        error: deleteError,
      } =
        await supabase.storage
          .from("avatars")
          .remove([
            oldAvatarPath,
          ]);

      if (deleteError) {
        console.warn(
          "La nueva foto se guardó, pero no se pudo eliminar la anterior:",
          deleteError
        );
      }
    }

    setMessage(
      "Foto de perfil actualizada correctamente."
    );

    setUploadingAvatar(
      false
    );

    event.target.value = "";
  }

  // =========================
  // ACTIVAR 2FA
  // =========================

  async function startMfaSetup() {
    setError("");
    setMessage("");
    setMfaLoading(true);

    try {
      const {
        data,
        error: factorsError,
      } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactor =
        data?.totp?.find(
          (factor) =>
            String(
              factor.status
            ) ===
            "verified"
        );

      if (verifiedFactor) {
        setMfaFactor({
          id: verifiedFactor.id,
          friendly_name:
            verifiedFactor.friendly_name ??
            "HormiGUITA",
          factor_type:
            verifiedFactor.factor_type,
          status: "verified",
        });

        setMessage(
          "La verificación en dos pasos ya está activada."
        );

        setMfaLoading(false);
        return;
      }

      // Si hay una configuración pendiente,
      // la eliminamos antes de crear otra.

      const pendingFactor =
        data?.totp?.find(
          (factor) =>
            String(
              factor.status
            ) ===
            "unverified"
        );

      if (pendingFactor) {
        const {
          error:
            removePendingError,
        } =
          await supabase.auth.mfa.unenroll(
            {
              factorId:
                pendingFactor.id,
            }
          );

        if (
          removePendingError
        ) {
          throw removePendingError;
        }
      }

      // Crear nuevo factor TOTP

      const {
        data: enrollData,
        error: enrollError,
      } =
        await supabase.auth.mfa.enroll(
          {
            factorType:
              "totp",
            friendlyName:
              "HormiGUITA",
          }
        );

      if (enrollError) {
        throw enrollError;
      }

      if (!enrollData) {
        throw new Error(
          "Supabase no devolvió los datos del factor."
        );
      }

      setMfaFactor({
        id: enrollData.id,
        friendly_name:
          enrollData.friendly_name ??
          "HormiGUITA",
        factor_type:
          enrollData.type,
        status:
          "unverified",
      });

      setMfaQrCode(
        enrollData.totp
          ?.qr_code ??
          null
      );

      setMfaSecret(
        enrollData.totp
          ?.secret ??
          null
      );

      // Crear challenge

      const {
        data: challengeData,
        error: challengeError,
      } =
        await supabase.auth.mfa.challenge(
          {
            factorId:
              enrollData.id,
          }
        );

      if (challengeError) {
        throw challengeError;
      }

      if (
        !challengeData?.id
      ) {
        throw new Error(
          "No se pudo generar el desafío MFA."
        );
      }

      setMfaChallengeId(
        challengeData.id
      );

      setMfaCode("");
      setShowMfaSetup(
        true
      );
    } catch (err) {
      console.error(
        "Error iniciando MFA:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar la configuración de 2FA."
      );
    }

    setMfaLoading(false);
  }

  // =========================
  // VERIFICAR 2FA
  // =========================

  async function verifyMfa() {
    setError("");
    setMessage("");

    const code =
      mfaCode.replace(
        /\D/g,
        ""
      );

    if (
      code.length !== 6
    ) {
      setError(
        "Ingresá el código de 6 dígitos de tu aplicación autenticadora."
      );
      return;
    }

    if (
      !mfaFactor?.id ||
      !mfaChallengeId
    ) {
      setError(
        "No hay un desafío MFA activo."
      );
      return;
    }

    setMfaLoading(true);

    try {
      const {
        error: verifyError,
      } =
        await supabase.auth.mfa.verify(
          {
            factorId:
              mfaFactor.id,
            challengeId:
              mfaChallengeId,
            code,
          }
        );

      if (verifyError) {
        throw verifyError;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        const {
          error:
            profileUpdateError,
        } =
          await supabase
            .from("profiles")
            .update({
              two_factor_enabled:
                true,
            })
            .eq(
              "id",
              user.id
            );

        if (
          profileUpdateError
        ) {
          console.warn(
            "2FA verificado, pero no se pudo actualizar profiles:",
            profileUpdateError
          );
        }
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                two_factor_enabled:
                  true,
              }
            : current
      );

      setMfaFactor(
        (current) =>
          current
            ? {
                ...current,
                status:
                  "verified",
              }
            : current
      );

      setShowMfaSetup(
        false
      );

      setMfaQrCode(
        null
      );

      setMfaSecret(
        null
      );

      setMfaChallengeId(
        null
      );

      setMfaCode("");

      setMessage(
        "¡2FA activado correctamente! Tu cuenta ahora tiene una segunda capa de seguridad."
      );
    } catch (err) {
      console.error(
        "Error verificando MFA:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "El código no es correcto."
      );
    }

    setMfaLoading(false);
  }

  // =========================
  // DESACTIVAR 2FA
  // =========================

  async function disableMfa() {
    setError("");
    setMessage("");

    if (!mfaFactor?.id) {
      setError(
        "No encontramos un factor 2FA activo."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "¿Seguro que querés desactivar la verificación en dos pasos?"
      );

    if (!confirmed) {
      return;
    }

    setMfaLoading(true);

    try {
      const {
        data: assuranceData,
        error: assuranceError,
      } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) {
        throw assuranceError;
      }

      if (
        assuranceData.currentLevel !==
        "aal2"
      ) {
        throw new Error(
          "Para desactivar 2FA primero necesitás confirmar tu identidad con el código de autenticación."
        );
      }

      const {
        error:
          unenrollError,
      } =
        await supabase.auth.mfa.unenroll(
          {
            factorId:
              mfaFactor.id,
          }
        );

      if (unenrollError) {
        throw unenrollError;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({
            two_factor_enabled:
              false,
          })
          .eq(
            "id",
            user.id
          );
      }

      setMfaFactor(null);

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                two_factor_enabled:
                  false,
              }
            : current
      );

      setMessage(
        "La verificación en dos pasos fue desactivada."
      );
    } catch (err) {
      console.error(
        "Error desactivando MFA:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo desactivar el 2FA."
      );
    }

    setMfaLoading(false);
  }

  // =========================
  // WHATSAPP
  // =========================

  async function generateWhatsAppCode() {
    if (whatsappGeneratingRef.current) {
      return;
    }

    whatsappGeneratingRef.current = true;

    setError("");
    setWhatsappLoading(true);
    setWhatsappCopied(false);

    try {
      const response = await fetch(
        "/api/whatsapp/link-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "No se pudo generar el código de vinculación."
        );
      }

      setWhatsappLinkingStarted(true);
      setWhatsappCode(data.code ?? null);
      setWhatsappExpiresAt(
        data.expiresAt ?? null
      );

      setWhatsappSecondsLeft(
        typeof data.expiresAt === "string"
          ? Math.max(
              0,
              Math.ceil(
                (new Date(data.expiresAt).getTime() -
                  Date.now()) /
                  1000
              )
            )
          : 600
      );
    } catch (err) {
      console.error(
        "Error generando código de WhatsApp:",
        err
      );

      setWhatsappLinkingStarted(false);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el código de vinculación."
      );
    } finally {
      whatsappGeneratingRef.current = false;
      setWhatsappLoading(false);
    }
  }

  async function loadWhatsAppConnection() {
    try {
      setWhatsappChecking(true);

      const response = await fetch(
        "/api/whatsapp/status",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "No se pudo consultar el estado de WhatsApp."
        );
      }

      const phone =
        typeof data?.phoneNumber === "string"
          ? data.phoneNumber
          : null;

      setWhatsappPhone(phone);

      if (phone) {
        setWhatsappCode(null);
        setWhatsappExpiresAt(null);
        setWhatsappSecondsLeft(0);
        setWhatsappLinkingStarted(false);
      }

      return phone;
    } catch (err) {
      console.error(
        "Error consultando WhatsApp:",
        err
      );

      // No inventamos una conexión si la consulta falla.
      setWhatsappPhone(null);
      return null;
    } finally {
      setWhatsappChecking(false);
    }
  }

  async function unlinkWhatsApp() {
    const confirmed = window.confirm(
      "¿Seguro que querés desvincular este WhatsApp de tu cuenta?"
    );

    if (!confirmed) return;

    setWhatsappLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/whatsapp/unlink",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ??
            "No se pudo desvincular WhatsApp."
        );
      }

      // Limpiamos todo el estado local inmediatamente.
      setWhatsappPhone(null);
      setWhatsappCode(null);
      setWhatsappExpiresAt(null);
      setWhatsappSecondsLeft(0);
      setWhatsappCopied(false);
      setWhatsappLinkingStarted(false);

      setMessage(
        "WhatsApp desvinculado correctamente."
      );
    } catch (err) {
      console.error(
        "Error desvinculando WhatsApp:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo desvincular WhatsApp."
      );
    } finally {
      setWhatsappLoading(false);
    }
  }

  function formatWhatsappTime(
    totalSeconds: number
  ) {
    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds =
      totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  async function copyWhatsAppCode() {
    if (!whatsappCode) return;

    try {
      await navigator.clipboard.writeText(
        whatsappCode
      );

      setWhatsappCopied(true);

      window.setTimeout(() => {
        setWhatsappCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "No se pudo copiar el código:",
        err
      );

      setError(
        "No se pudo copiar el código. Copialo manualmente."
      );
    }
  }

  function getWhatsAppLink() {
    const officialPhone = "5491125058229";

    const text = whatsappCode
      ? `Hola, quiero vincular mi cuenta de HormiGUITA. Mi código es: ${whatsappCode}`
      : "";

    return `https://wa.me/${officialPhone}?text=${encodeURIComponent(text)}`;
  }

  // =========================
  // LOGOUT
  // =========================

  async function logout() {
    await supabase.auth.signOut();
    window.location.href =
      "/login";
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] text-white">

        <div className="text-center">

          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/10">

            <span className="h-3 w-3 animate-pulse rounded-full bg-[#27d59b]" />

          </div>

          <p className="text-gray-400">
            Cargando tu perfil...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">

      {/* SIDEBAR */}

      <Sidebar
        active="perfil"
        onLogout={logout}
      />

      {/* CONTENIDO */}

      <section className="lg:ml-64">

        {/* TOPBAR */}

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#080a0d]/90 px-6 backdrop-blur-xl lg:px-10">

          <div>

            <h1 className="text-xl font-bold">
              Mi Cuenta
            </h1>

            <p className="text-sm text-gray-500">
              Configuración de tu cuenta
            </p>

          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
          >
            Volver
          </Link>

        </header>

        <div className="mx-auto max-w-4xl p-6 lg:p-10">

          {/* TITULO */}

          <div className="mb-8">

            <div className="text-sm font-medium text-[#27d59b]">
              CONFIGURACIÓN
            </div>

            <h2 className="mt-2 text-4xl font-black">
              Tu cuenta
            </h2>

            <p className="mt-2 text-gray-400">
              Administrá tu información personal y seguridad.
            </p>

          </div>

          {/* MENSAJES */}

          {message && (
            <div className="mb-6 rounded-xl border border-[#27d59b]/20 bg-[#27d59b]/10 p-4 text-sm text-[#b9f8db]">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* PERFIL */}

          <section className="rounded-3xl border border-gray-800 bg-[#111720] p-6 lg:p-8">

            <div className="mb-8">

              <h3 className="text-xl font-bold">
                Información personal
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Estos datos identifican tu cuenta.
              </p>

            </div>

            <form
              onSubmit={saveProfile}
              className="space-y-6"
            >

              {/* FOTO */}

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#27d59b] to-[#16b78a] text-3xl font-black text-[#032119]">

                  {avatarPreview ? (
                    <img
                      src={
                        avatarPreview
                      }
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (
                      profile?.full_name?.charAt(
                        0
                      ) ?? "U"
                    ).toUpperCase()
                  )}

                </div>

                <div>

                  <h4 className="font-semibold">
                    Foto de perfil
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    JPG, PNG o WEBP. Máximo 2 MB.
                  </p>

                  <label
                    className={`mt-3 inline-block rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition ${
                      uploadingAvatar
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-white/5"
                    }`}
                  >
                    {uploadingAvatar
                      ? "Subiendo..."
                      : "Cambiar foto"}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={
                        handleAvatarChange
                      }
                      disabled={
                        uploadingAvatar
                      }
                      className="hidden"
                    />

                  </label>

                </div>

              </div>

              {/* NOMBRE */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Nombre
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-800 bg-[#080c11] px-4 py-3 text-gray-500 outline-none"
                />

                <p className="mt-2 text-xs text-gray-600">
                  El cambio de correo lo agregaremos después mediante verificación de seguridad.
                </p>

              </div>

              <button
                type="submit"
                disabled={
                  savingProfile
                }
                className="rounded-xl bg-[#27d59b] px-6 py-3 font-extrabold text-[#032119] transition hover:brightness-110 disabled:opacity-50"
              >
                {savingProfile
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>

            </form>

          </section>

          {/* WHATSAPP */}

          <section className="mt-5 overflow-hidden rounded-3xl border border-gray-800 bg-[#111720] p-5 sm:p-6 lg:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/10 text-xl">
                  💬
                </div>

                <div>

                  <h3 className="text-xl font-bold text-white">
                    {whatsappPhone
                      ? "WhatsApp conectado"
                      : "Conectá WhatsApp"}
                  </h3>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    {whatsappPhone
                      ? "Tu WhatsApp está vinculado correctamente a esta cuenta de HormiGUITA."
                      : "Vinculá tu WhatsApp para registrar movimientos y consultar información directamente desde tus mensajes."}
                  </p>

                </div>

              </div>

              {!whatsappPhone && !whatsappLinkingStarted && (

                <button
                  type="button"
                  onClick={() => void generateWhatsAppCode()}
                  disabled={whatsappLoading}
                  className="shrink-0 rounded-xl bg-[#27d59b] px-6 py-3 font-bold text-[#032119] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {whatsappLoading
                    ? "Preparando..."
                    : "Vincular WhatsApp"}
                </button>

              )}

            </div>

            {whatsappPhone ? (

              <div className="mt-7 rounded-2xl border border-[#27d59b]/20 bg-[#0b1016] p-5 sm:p-6">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#27d59b]/30 bg-[#27d59b]/10 text-2xl font-bold text-[#27d59b]">
                      ✓
                    </div>

                    <div>

                      <p className="text-lg font-bold text-white">
                        WhatsApp conectado correctamente
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Número vinculado: <span className="font-semibold text-[#27d59b]">{whatsappPhone}</span>
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => void unlinkWhatsApp()}
                    disabled={whatsappLoading}
                    className="rounded-xl border border-red-500/50 px-5 py-3 font-bold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {whatsappLoading
                      ? "Desvinculando..."
                      : "Desvincular WhatsApp"}
                  </button>

                </div>

              </div>

            ) : whatsappLinkingStarted ? (

              <div className="mt-7 overflow-hidden rounded-2xl border border-[#27d59b]/20 bg-[#0b1016]">

                <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">

                  <div className="flex min-h-[340px] items-center justify-center border-b border-[#27d59b]/15 p-8 lg:border-b-0 lg:border-r">

                    {whatsappCode ? (

                      <div className="rounded-2xl bg-white p-4 shadow-[0_0_35px_rgba(39,213,155,0.12)]">
                        <QRCode
                          value={getWhatsAppLink()}
                          size={230}
                          level="M"
                        />
                      </div>

                    ) : (

                      <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#27d59b]/20 border-t-[#27d59b]" />
                        <p className="mt-4 text-sm text-gray-500">
                          Generando tu QR...
                        </p>
                      </div>

                    )}

                  </div>

                  <div className="flex flex-col justify-center p-6 sm:p-8">

                    <p className="text-2xl font-black text-white">
                      Escaneá con WhatsApp
                    </p>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                      Escaneá el código QR con tu teléfono. Se abrirá el chat oficial de HormiGUITA con tu código de vinculación listo para enviar.
                    </p>

                    <div className="mt-6 rounded-xl border border-[#27d59b]/20 bg-[#080a0d] p-4">

                      <div className="flex items-center justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-xs text-gray-600">
                            Código de vinculación
                          </p>

                          <p className="mt-1 truncate font-mono text-xl font-black tracking-wide text-[#27d59b]">
                            {whatsappCode ?? "Generando..."}
                          </p>

                        </div>

                        {whatsappCode && (
                          <button
                            type="button"
                            onClick={() => void copyWhatsAppCode()}
                            className="shrink-0 rounded-lg border border-gray-700 px-3 py-2 text-xs font-bold text-gray-300 transition hover:bg-white/5"
                          >
                            {whatsappCopied ? "¡Copiado!" : "Copiar"}
                          </button>
                        )}

                      </div>

                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">

                      <span>⏱</span>

                      <span>
                        Válido por{" "}
                        <strong className="text-[#27d59b]">
                          {formatWhatsappTime(whatsappSecondsLeft)}
                        </strong>
                      </span>

                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                      {whatsappCode && (
                        <a
                          href={getWhatsAppLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-1 items-center justify-center rounded-xl bg-[#27d59b] px-5 py-3 font-bold text-[#032119] transition hover:brightness-110"
                        >
                          Abrir WhatsApp
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => void generateWhatsAppCode()}
                        disabled={whatsappLoading}
                        className="rounded-xl border border-[#27d59b]/30 px-5 py-3 font-bold text-[#27d59b] transition hover:bg-[#27d59b]/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {whatsappLoading
                          ? "Generando..."
                          : "Nuevo código"}
                      </button>

                    </div>

                  </div>

                </div>

                <div className="border-t border-white/5 px-6 py-4 text-center text-xs text-gray-600 sm:px-8">
                  Si el código vence, se generará uno nuevo automáticamente. También podés generar uno nuevo cuando quieras.
                </div>

              </div>

            ) : (

              <div className="mt-7 rounded-2xl border border-dashed border-gray-800 bg-[#0b1016] p-8 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#27d59b]/10 text-xl">
                  📱
                </div>

                <p className="mt-4 font-semibold text-gray-200">
                  Conectá tu cuenta para usar HormiGUITA desde WhatsApp
                </p>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
                  Tocá “Vincular WhatsApp” para generar un código temporal y un QR seguro.
                </p>

              </div>

            )}

          </section>

          {/* SEGURIDAD */}

          <section className="mt-5 rounded-3xl border border-gray-800 bg-[#111720] p-6 lg:p-8">

            <div className="mb-8">

              <h3 className="text-xl font-bold">
                Seguridad
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Protegé tu cuenta de HormiGUITA.
              </p>

            </div>

            {/* PASSWORD */}

            <form
              onSubmit={
                changePassword
              }
              className="space-y-5"
            >

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Nueva contraseña
                </label>

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Repetir contraseña
                </label>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Repetí la nueva contraseña"
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              <button
                type="submit"
                disabled={
                  savingPassword
                }
                className="rounded-xl border border-[#27d59b]/40 bg-[#27d59b]/10 px-6 py-3 font-bold text-[#27d59b] transition hover:bg-[#27d59b]/15 disabled:opacity-50"
              >
                {savingPassword
                  ? "Actualizando..."
                  : "Cambiar contraseña"}
              </button>

            </form>

            {/* 2FA */}

            <div className="mt-8 border-t border-white/5 pt-8">

              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

                <div className="max-w-xl">

                  <div className="flex flex-wrap items-center gap-3">

                    <h4 className="font-bold">
                      Verificación en dos pasos
                    </h4>

                    {profile?.two_factor_enabled && (
                      <span className="rounded-full bg-[#27d59b]/10 px-3 py-1 text-xs font-bold text-[#27d59b]">
                        ACTIVADO
                      </span>
                    )}

                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Protegé tu cuenta con una aplicación autenticadora y un código de 6 dígitos.
                  </p>

                </div>

                {profile?.two_factor_enabled ? (

                  <button
                    type="button"
                    onClick={
                      disableMfa
                    }
                    disabled={
                      mfaLoading
                    }
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    {mfaLoading
                      ? "Procesando..."
                      : "Desactivar 2FA"}
                  </button>

                ) : (

                  <button
                    type="button"
                    onClick={
                      startMfaSetup
                    }
                    disabled={
                      mfaLoading
                    }
                    className="rounded-xl bg-[#27d59b] px-5 py-3 font-bold text-[#032119] transition hover:brightness-110 disabled:opacity-50"
                  >
                    {mfaLoading
                      ? "Preparando..."
                      : "Activar 2FA"}
                  </button>

                )}

              </div>

              {/* CONFIGURACIÓN 2FA */}

              {showMfaSetup && (
                <div className="mt-8 rounded-2xl border border-[#27d59b]/20 bg-[#0b1016] p-6">

                  <div className="mb-6">

                    <h4 className="text-lg font-bold">
                      Configurá tu autenticador
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Escaneá el código QR con Google Authenticator, Microsoft Authenticator, Authy u otra aplicación compatible con TOTP.
                    </p>

                  </div>

                  <div className="grid gap-8 md:grid-cols-2">

                    {/* QR */}

                    <div className="flex flex-col items-center justify-center">

                      {mfaQrCode ? (

                        <div className="rounded-2xl bg-white p-4">

                          <img
                            src={
                              mfaQrCode.startsWith(
                                "data:"
                              )
                                ? mfaQrCode
                                : `data:image/svg+xml;utf8,${encodeURIComponent(
                                    mfaQrCode
                                  )}`
                            }
                            alt="Código QR para configurar 2FA"
                            className="h-56 w-56"
                          />

                        </div>

                      ) : (

                        <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-gray-800 bg-[#111720] text-center text-sm text-gray-500">
                          No se pudo cargar el código QR.
                        </div>

                      )}

                      {mfaSecret && (
                        <div className="mt-5 w-full">

                          <p className="text-xs text-gray-500">
                            Clave manual
                          </p>

                          <div className="mt-2 break-all rounded-xl border border-gray-800 bg-[#111720] p-3 text-center text-xs font-mono text-gray-300">
                            {mfaSecret}
                          </div>

                        </div>
                      )}

                    </div>

                    {/* CÓDIGO */}

                    <div className="flex flex-col justify-center">

                      <label className="mb-2 block text-sm font-semibold text-gray-300">
                        Código de 6 dígitos
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={
                          mfaCode
                        }
                        onChange={(e) =>
                          setMfaCode(
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                6
                              )
                          )
                        }
                        placeholder="123456"
                        className="w-full rounded-xl border border-gray-700 bg-[#111720] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none focus:border-[#27d59b]"
                      />

                      <button
                        type="button"
                        onClick={
                          verifyMfa
                        }
                        disabled={
                          mfaLoading ||
                          mfaCode.length !==
                            6
                        }
                        className="mt-4 rounded-xl bg-[#27d59b] px-5 py-3 font-extrabold text-[#032119] transition hover:brightness-110 disabled:opacity-50"
                      >
                        {mfaLoading
                          ? "Verificando..."
                          : "Confirmar y activar 2FA"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMfaSetup(
                            false
                          );
                          setMfaQrCode(
                            null
                          );
                          setMfaSecret(
                            null
                          );
                          setMfaChallengeId(
                            null
                          );
                          setMfaCode("");
                        }}
                        disabled={
                          mfaLoading
                        }
                        className="mt-3 rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                      >
                        Cancelar
                      </button>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </section>

          {/* CUENTA */}

          <section className="mt-5 rounded-3xl border border-red-500/10 bg-[#120c0f] p-6 lg:p-8">

            <div className="mb-5">

              <h3 className="font-bold text-red-300">
                Zona de cuenta
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Acciones relacionadas con tu sesión.
              </p>

            </div>

            <button
              onClick={
                logout
              }
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 font-bold text-red-400 transition hover:bg-red-500/10"
            >

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
                <path d="m14 8 4 4-4 4" />
                <path d="M18 12H9" />
              </svg>

              <span>
                Cerrar sesión
              </span>

            </button>

          </section>

        </div>

      </section>

    </main>
  );
}