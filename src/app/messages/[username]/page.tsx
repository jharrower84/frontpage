"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MessageRedirect() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  useEffect(() => {
    router.replace(`/messages`);
  }, []);

  return null;
}