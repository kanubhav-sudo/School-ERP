/**
 * Block-Based Visual Template Editor Component
 *
 * Provides a clean, intuitive visual editor for school administrators.
 * Admins configure blocks, colors, typography, watermark, signatures, and instructions
 * with real-time LIVE PREVIEW.
 * Editing creates a new version (version n+1) without overwriting historical versions.
 *
 * @module features/document-engine/components/BlockBasedTemplateEditor
 */

import React, { useState, useEffect } from 'react'
import type {
  DocumentType,
  TemplatePreset,
  DocumentTemplateConfig,
  CompiledDocumentPayload,
} from '../document-engine.types'
import { documentEngineApi } from '../document-engine.api'
import { AdmitCardRenderer } from './AdmitCardRenderer'
import { ReportCardRenderer } from './ReportCardRenderer'

interface BlockBasedTemplateEditorProps {
  documentType: DocumentType
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export const BlockBasedTemplateEditor: React.FC<BlockBasedTemplateEditorProps> = ({
  documentType,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'blocks' | 'branding' | 'watermark' | 'signatures' | 'instructions'>('presets')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [previewPayload, setPreviewPayload] = useState<CompiledDocumentPayload | null>(null)
  const [config, setConfig] = useState<DocumentTemplateConfig | null>(null)

  const loadTemplateAndPreview = async () => {
    try {
      setLoading(true)
      const preview = await documentEngineApi.getLivePreview(documentType)
      setPreviewPayload(preview)
      setConfig(preview.template.config)
    } catch (err) {
      console.error('Failed to load template configuration', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial template configuration & live preview payload
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadTemplateAndPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, documentType])


  // Preset switch handler
  const handlePresetSwitch = async (preset: TemplatePreset) => {
    try {
      setLoading(true)
      const resetTemplate = await documentEngineApi.resetTemplate(documentType, preset)
      setConfig(resetTemplate.configuration)
      // Update preview payload
      if (previewPayload) {
        setPreviewPayload({
          ...previewPayload,
          template: {
            ...previewPayload.template,
            preset,
            config: resetTemplate.configuration,
          },
        })
      }
    } catch (err) {
      console.error('Failed to reset preset', err)
    } finally {
      setLoading(false)
    }
  }

  // Local config change handler (updates preview immediately!)
  const updateConfig = (updater: (prev: DocumentTemplateConfig) => DocumentTemplateConfig) => {
    if (!config) return
    const newConfig = updater(config)
    setConfig(newConfig)

    if (previewPayload) {
      setPreviewPayload({
        ...previewPayload,
        template: {
          ...previewPayload.template,
          config: newConfig,
        },
      })
    }
  }

  // Block reorder helper
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (!config) return
    const blocks = [...config.blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= blocks.length) return

    const temp = blocks[index]
    blocks[index] = blocks[targetIndex]
    blocks[targetIndex] = temp

    // Update order indexes
    blocks.forEach((b, i) => {
      b.order = i + 1
    })

    updateConfig((prev) => ({ ...prev, blocks }))
  }

  // Save new template version
  const handleSave = async () => {
    if (!config) return
    try {
      setSaving(true)
      await documentEngineApi.saveTemplate(documentType, {
        preset: config.preset,
        title: config.title,
        configuration: config,
      })
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save template version', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex flex-col">
      {/* Editor Header Bar */}
      <div className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center space-x-4">
          <span className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
          <div>
            <h3 className="font-bold text-base leading-tight">
              Visual Template Editor — {documentType.replace('_', ' ')}
            </h3>
            <p className="text-xs text-gray-400">
              Version {previewPayload?.template.version || 1} • {config?.preset || 'CBSE'} Pattern
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md shadow transition-colors flex items-center cursor-pointer"
          >
            {saving ? 'Saving Version...' : 'Save New Version'}
          </button>
        </div>
      </div>

      {/* Editor Body Grid: Control Panel (Left) & Live Preview (Right) */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-gray-100">
        {/* Left Side: Control Panel (5 cols) */}
        <div className="col-span-5 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'presets' ? 'border-blue-600 text-blue-600 font-bold bg-white' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'blocks' ? 'border-blue-600 text-blue-600 font-bold bg-white' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'branding' ? 'border-blue-600 text-blue-600 font-bold bg-white' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Branding
            </button>
            <button
              onClick={() => setActiveTab('watermark')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'watermark' ? 'border-blue-600 text-blue-600 font-bold bg-white' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Watermark
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'signatures' ? 'border-blue-600 text-blue-600 font-bold bg-white' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Signatures
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'instructions' ? 'border-blue-600 text-blue-600 font-bold bg-white' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Instructions
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading || !config ? (
              <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
                Loading Template Configuration...
              </div>
            ) : (
              <>
                {/* 1. Presets Tab */}
                {activeTab === 'presets' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Select Template Preset</h4>
                    <p className="text-xs text-gray-500">
                      Choose an official board pattern preset. Resetting to a preset will apply standard formatting rules.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['CBSE', 'ICSE', 'STATE_BOARD', 'CUSTOM'] as TemplatePreset[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePresetSwitch(p)}
                          className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            config.preset === p
                              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="font-bold text-sm text-gray-900">{p.replace('_', ' ')}</span>
                          <span className="text-[10px] text-gray-500 mt-1">Official Board Pattern</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Blocks Tab */}
                {activeTab === 'blocks' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Configure Document Blocks</h4>
                    <p className="text-xs text-gray-500">Enable/disable or reorder sections included in the document.</p>
                    <div className="space-y-2">
                      {config.blocks.map((block, idx) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={block.enabled}
                              onChange={(e) => {
                                const checked = e.target.checked
                                updateConfig((prev) => ({
                                  ...prev,
                                  blocks: prev.blocks.map((b) => (b.id === block.id ? { ...b, enabled: checked } : b)),
                                }))
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-gray-800">{block.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => moveBlock(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveBlock(idx, 'down')}
                              disabled={idx === config.blocks.length - 1}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Branding Tab */}
                {activeTab === 'branding' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Branding & Color Theme</h4>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Document Title</label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) => updateConfig((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={config.branding.primaryColor}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              branding: { ...prev.branding, primaryColor: e.target.value },
                            }))
                          }
                          className="w-full h-9 rounded p-1 border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Accent Color</label>
                        <input
                          type="color"
                          value={config.branding.accentColor}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              branding: { ...prev.branding, accentColor: e.target.value },
                            }))
                          }
                          className="w-full h-9 rounded p-1 border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={config.branding.fontFamily}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              fontFamily: e.target.value as DocumentTemplateConfig['branding']['fontFamily'],
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-blue-500"
                      >
                        <option value="Inter">Inter (Modern Clean)</option>
                        <option value="Roboto">Roboto (Standard Sans)</option>
                        <option value="Outfit">Outfit (Geometric Modern)</option>
                        <option value="Playfair">Playfair (Classic Serif)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. Watermark Tab */}
                {activeTab === 'watermark' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Watermark Configuration</h4>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.watermark.enabled}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            watermark: { ...prev.watermark, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-gray-800">Enable Background Watermark</span>
                    </div>
                    {config.watermark.enabled && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Watermark Text</label>
                          <input
                            type="text"
                            value={config.watermark.text}
                            onChange={(e) =>
                              updateConfig((prev) => ({
                                ...prev,
                                watermark: { ...prev.watermark, text: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Watermark Opacity: {Math.round(config.watermark.opacity * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0.02"
                            max="0.25"
                            step="0.01"
                            value={config.watermark.opacity}
                            onChange={(e) =>
                              updateConfig((prev) => ({
                                ...prev,
                                watermark: { ...prev.watermark, opacity: parseFloat(e.target.value) },
                              }))
                            }
                            className="w-full cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 5. Signatures Tab */}
                {activeTab === 'signatures' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Signature Blocks</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-medium">Principal Signature</span>
                        <input
                          type="checkbox"
                          checked={config.signatureBlocks.showPrincipal}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              signatureBlocks: { ...prev.signatureBlocks, showPrincipal: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-medium">Exam Controller Signature</span>
                        <input
                          type="checkbox"
                          checked={config.signatureBlocks.showExamController}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              signatureBlocks: { ...prev.signatureBlocks, showExamController: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-medium">Class Teacher Signature</span>
                        <input
                          type="checkbox"
                          checked={config.signatureBlocks.showTeacher}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              signatureBlocks: { ...prev.signatureBlocks, showTeacher: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-medium">Candidate Signature</span>
                        <input
                          type="checkbox"
                          checked={config.signatureBlocks.showCandidate}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              signatureBlocks: { ...prev.signatureBlocks, showCandidate: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Instructions Tab */}
                {activeTab === 'instructions' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Candidate Rules & Instructions</h4>
                    <div className="space-y-2">
                      {config.instructions.map((inst, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={inst}
                            onChange={(e) => {
                              const newInst = [...config.instructions]
                              newInst[i] = e.target.value
                              updateConfig((prev) => ({ ...prev, instructions: newInst }))
                            }}
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => {
                              const newInst = config.instructions.filter((_, idx) => idx !== i)
                              updateConfig((prev) => ({ ...prev, instructions: newInst }))
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            instructions: [...prev.instructions, 'New rule or candidate instruction.'],
                          }))
                        }
                        className="mt-2 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        + Add Rule
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side: LIVE PREVIEW Pane (7 cols) */}
        <div className="col-span-7 p-6 overflow-y-auto flex flex-col items-center justify-start bg-gray-200">
          <div className="w-full max-w-[210mm] mb-2 flex items-center justify-between text-xs text-gray-600">
            <span className="font-bold uppercase tracking-wider text-gray-700">Real-Time Live Preview</span>
            <span>A4 Document Canvas</span>
          </div>

          {previewPayload ? (
            documentType === 'ADMIT_CARD' ? (
              <AdmitCardRenderer payload={previewPayload} showPrintButton={false} />
            ) : (
              <ReportCardRenderer payload={previewPayload} showPrintButton={false} />
            )
          ) : (
            <div className="w-[210mm] h-[297mm] bg-white shadow-xl flex items-center justify-center text-gray-400">
              Generating Live Document Preview...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
