"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAIConfigStore } from "@/stores/ai-config-store";
import { toast } from "sonner";

interface AIConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIConfigDialog({ open, onOpenChange }: AIConfigDialogProps) {
  const { config, setConfig, resetConfig } = useAIConfigStore();
  const [localConfig, setLocalConfig] = useState({ ...config });

  // 打开 Dialog 时，将 store 配置同步到本地状态
  useEffect(() => {
    if (open) {
      setLocalConfig({ ...config });
    }
  }, [open, config]);

  const handleSave = () => {
    setConfig(localConfig);
    toast.success("AI 配置已保存");
    onOpenChange(false);
  };

  const handleReset = () => {
    resetConfig();
    // 从 store 读取重置后的默认值，同步本地状态
    const defaultConfig = useAIConfigStore.getState().config;
    setLocalConfig({ ...defaultConfig });
    toast.success("AI 配置已重置为默认值");
  };

  const isConfigured = !!config.apiKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🤖</span> AI 配置
          </DialogTitle>
          <DialogDescription>
            配置 AI 分析使用的 LLM 参数。支持 OpenAI 兼容接口。
          </DialogDescription>
        </DialogHeader>

        {/* 配置状态指示 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">状态：</span>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
              <span className="size-2 rounded-full bg-emerald-500" />
              已配置
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              未配置
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={localConfig.apiKey}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, apiKey: e.target.value })
              }
            />
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
              value={localConfig.baseUrl}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, baseUrl: e.target.value })
              }
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              type="text"
              placeholder="gpt-4o-mini"
              value={localConfig.model}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, model: e.target.value })
              }
            />
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {localConfig.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[localConfig.temperature]}
              onValueChange={([val]) =>
                setLocalConfig({ ...localConfig, temperature: val })
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={handleReset}>
            重置为默认
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
