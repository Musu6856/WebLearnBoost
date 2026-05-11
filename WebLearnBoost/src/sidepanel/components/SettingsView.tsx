import { Save } from "lucide-react";
import { useState } from "react";
import type { AppSettings } from "../../shared/types";

interface SettingsViewProps {
  onSave: (settings: AppSettings) => void;
  settings: AppSettings;
}

export function SettingsView({ onSave, settings }: SettingsViewProps) {
  const [draft, setDraft] = useState<AppSettings>(settings);

  const updateDraft = (field: keyof AppSettings, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <article className="card">
        <span className="eyebrow">模型设置</span>
        <label>
          Provider
          <select value={draft.provider} onChange={(event) => updateDraft("provider", event.target.value)}>
            <option value="openai-compatible">OpenAI Compatible</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama</option>
          </select>
        </label>
        <label>
          Base URL
          <input value={draft.baseUrl} onChange={(event) => updateDraft("baseUrl", event.target.value)} placeholder="https://api.openai.com/v1" />
        </label>
        <label>
          API Key
          <input value={draft.apiKey} onChange={(event) => updateDraft("apiKey", event.target.value)} type="password" placeholder="sk-..." />
        </label>
        <label>
          Model
          <input value={draft.model} onChange={(event) => updateDraft("model", event.target.value)} placeholder="gpt-4o-mini" />
        </label>
        <label>
          输出语言
          <input value={draft.outputLanguage} onChange={(event) => updateDraft("outputLanguage", event.target.value)} placeholder="中文" />
        </label>
      </article>
      <button className="primary" type="submit">
        <Save size={18} />保存配置
      </button>
    </form>
  );
}
