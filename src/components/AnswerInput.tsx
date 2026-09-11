"use client";

import { useEffect, useRef } from "react";
import type { QuestionType } from "@/data/questions";
import { ChoiceGroup } from "./ChoiceGroup";

type Props = {
  type: QuestionType;
  options?: string[] | null;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 16,
  padding: "12px 14px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text)",
  outline: "none",
};

export function AnswerInput({ type, options, value, onChange, onBlur }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  if (type === "yes_no" || type === "single_choice" || type === "multi_choice") {
    return <ChoiceGroup type={type} options={options} value={value} onChange={onChange} />;
  }

  if (type === "text_long") {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Javobingizni yozing..."
        rows={4}
        style={{ ...inputStyle, resize: "none", lineHeight: 1.4, minHeight: 96 }}
      />
    );
  }

  if (type === "number") {
    return (
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        placeholder="Son kiriting..."
        style={inputStyle}
      />
    );
  }

  if (type === "money") {
    return (
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        placeholder="Summani kiriting (so'm)..."
        style={inputStyle}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder="Javobingizni yozing..."
      style={inputStyle}
    />
  );
}
