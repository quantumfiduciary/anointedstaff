import { useEffect, useState } from "react"
import { releaseChangeLog, releaseItems } from "../releaseNotes"
import { providerById, providersFor, type ModelProviderId } from "../modelProviders"
import {
  confirmLeaveDevice,
  defaultSystemPrompt,
  donateUrl,
  modelHostLeavesDevice,
  pluginMeta,
  type AppSettings,
  type PluginId,
} from "../settings"
import { searchWeb, type WebHit } from "../search/web"
import { deskThemeHint, deskThemeLabel, deskThemes, type DeskTheme } from "../theme"
import { listVoices, speak } from "../voice"
import { isBrave } from "../voiceChat"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

const whatsNew = releaseChangeLog().slice(0, 4)

type SettingsPaneProps = {
  settings: AppSettings
  modelState: string
  theme: DeskTheme
  onTheme: (theme: DeskTheme) => void
  onChange: (settings: AppSettings) => void
  onTest: () => Promise<string>
}

const settingsSections = [
  ["set-model", "Model"],
  ["set-voice", "Voice"],
  ["set-desk", "Desk"],
  ["set-web", "Web"],
  ["set-plugins", "Plugins"],
  ["set-about", "About"],
] as const

export function SettingsPane({ settings, modelState, theme, onTheme, onChange, onTest }: SettingsPaneProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    const refresh = () => setVoices(listVoices())
    refresh()
    const later = window.setTimeout(refresh, 500)
    window.speechSynthesis?.addEventListener("voiceschanged", refresh)
    return () => {
      window.clearTimeout(later)
      window.speechSynthesis?.removeEventListener("voiceschanged", refresh)
    }
  }, [])
  const [webQuery, setWebQuery] = useState("Psalm 19 heavens")
  const [webHits, setWebHits] = useState<WebHit[] | null>(null)
  const [webNote, setWebNote] = useState("")
  const [testNote, setTestNote] = useState("")
  const [testing, setTesting] = useState(false)
  const providerList = providersFor(settings.modelMode)
  const activeProvider = providerById(settings.modelProvider) ?? providerList[0]
  const keyMissing = Boolean(activeProvider?.keyRequired && !settings.modelKey.trim())

  function patch(next: Partial<AppSettings>) {
    onChange({ ...settings, ...next })
  }

  function setMode(mode: "local" | "cloud") {
    const list = providersFor(mode)
    const keep = list.find((item) => item.id === settings.modelProvider) ?? list[0]
    patch({
      modelMode: mode,
      modelProvider: keep.id,
      modelUrl: keep.url,
      modelName: keep.model,
    })
  }

  function setProvider(id: ModelProviderId) {
    const next = providerById(id)
    if (!next) return
    patch({
      modelMode: next.mode,
      modelProvider: next.id,
      modelUrl: next.id.startsWith("custom-") ? settings.modelUrl || next.url : next.url,
      modelName: next.id.startsWith("custom-") ? settings.modelName || next.model : next.model,
    })
  }

  function togglePlugin(id: PluginId) {
    patch({ plugins: { ...settings.plugins, [id]: !settings.plugins[id] } })
  }

  async function tryWeb() {
    if (
      modelHostLeavesDevice(settings.searxUrl) &&
      !confirmLeaveDevice(
        "searx",
        "Send this search query to your SearXNG host?\n\nThis leaves the device. Cancel to keep the query on this machine only.",
      )
    ) {
      setWebNote("Search cancelled — query stayed on this device.")
      return
    }
    setWebNote("Searching…")
    setWebHits(null)
    try {
      const hits = await searchWeb(settings.searxUrl, webQuery, settings.searxLanguage)
      setWebHits(hits)
      setWebNote(hits.length ? `${hits.length} results` : "SearXNG returned no results.")
    } catch (reason) {
      setWebHits([])
      setWebNote(reason instanceof Error ? reason.message : "SearXNG did not answer.")
    }
  }

  return (
    <div className="settings-pane">
      <nav className="segmented gem-nav settings-nav" aria-label="Settings sections">
        {settingsSections.map(([id, label]) => (
          <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            {label}
          </button>
        ))}
      </nav>
      <Card id="set-model">
        <CardHeader>
          <Badge>Language model</Badge>
          <CardTitle>AI model</CardTitle>
          <CardDescription>
            Chat and Voice stay quiet until this is on. Pick Local or Cloud, then a provider. Keys stay in this browser. Status: {modelState}. Agent instructions below shape both text and voice; edit them to focus a season of study.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <label className="setting-check">
            <input type="checkbox" checked={settings.modelOn} onChange={(event) => patch({ modelOn: event.target.checked })} />
            Turn the model on so Chat can answer
          </label>
          <label className="setting-field">
            Where the model runs
            <select aria-label="Model location" value={settings.modelMode} onChange={(event) => setMode(event.target.value === "cloud" ? "cloud" : "local")}>
              <option value="local">Local</option>
              <option value="cloud">Cloud</option>
            </select>
          </label>
          <label className="setting-field">
            Provider
            <select
              aria-label="Model provider"
              value={activeProvider?.id ?? settings.modelProvider}
              onChange={(event) => setProvider(event.target.value as ModelProviderId)}
            >
              {providerList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {activeProvider ? (
            <div className="provider-needs" role="region" aria-label="What you need for this provider">
              <p className="provider-needs-title">What you need</p>
              <ul>
                {activeProvider.needs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {activeProvider.keyRequired ? <p className="quiet m-0">An API key is required before Test connection will succeed.</p> : null}
            </div>
          ) : null}
          <label className="setting-field">
            Address
            <Input
              value={settings.modelUrl}
              onChange={(event) => patch({ modelUrl: event.target.value, modelProvider: settings.modelProvider.startsWith("custom-") ? settings.modelProvider : settings.modelMode === "cloud" ? "custom-cloud" : "custom-local" })}
              aria-label="Model address"
              placeholder={settings.modelMode === "cloud" ? "https://api.openai.com/v1" : "http://127.0.0.1:11434/v1"}
            />
          </label>
          <label className="setting-field">
            API key
            <Input
              type="password"
              value={settings.modelKey}
              onChange={(event) => patch({ modelKey: event.target.value })}
              aria-label="Model API key"
              placeholder={activeProvider?.keyRequired ? "Required for this provider" : "Leave empty for most local servers"}
              autoComplete="off"
            />
          </label>
          <label className="setting-check">
            <input
              type="checkbox"
              checked={settings.persistSecrets}
              onChange={(event) => patch({ persistSecrets: event.target.checked })}
            />
            <span>
              Keep API keys on this device
              <small className="quiet"> Off = this browser session only (safer on shared machines). On = save in this browser’s storage.</small>
            </span>
          </label>
          <label className="setting-field">
            Model name
            <Input value={settings.modelName} onChange={(event) => patch({ modelName: event.target.value })} aria-label="Model name" />
          </label>
          <label className="setting-field">
            Timeout in seconds
            <Input
              type="number"
              min={10}
              max={300}
              value={settings.modelTimeout}
              onChange={(event) => patch({ modelTimeout: Number(event.target.value) || 120 })}
            />
          </label>
          <label className="setting-field">
            Agent instructions (text + voice)
            <textarea
              className="agent-prompt"
              value={settings.systemPrompt}
              onChange={(event) => patch({ systemPrompt: event.target.value })}
              aria-label="Agent system prompt"
              spellCheck
              rows={12}
            />
          </label>
          <p className="quiet m-0">
            Shared by Chat and Voice. Edit freely to focus a season of study (one book, Hebrew stems, Heavens beside a verse, and so on). Empty restores the Anointed Staff default on the next ask.
          </p>
          <div className="gem-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => patch({ systemPrompt: defaultSystemPrompt })}
              disabled={settings.systemPrompt === defaultSystemPrompt}
            >
              Restore default prompt
            </Button>
            <Button
              type="button"
              onClick={() => {
                setTesting(true)
                setTestNote("Connecting…")
                void onTest().then((note) => {
                  setTestNote(note)
                  setTesting(false)
                })
              }}
              disabled={testing || !settings.modelUrl.trim() || keyMissing}
            >
              Test connection
            </Button>
          </div>
          {keyMissing ? <p className="quiet m-0">Add an API key for {activeProvider?.label ?? "this provider"} first.</p> : null}
          {testNote ? <p className="quiet m-0">{testNote}</p> : null}
        </CardContent>
      </Card>

      <Card id="set-voice">
        <CardHeader>
          <Badge>Voice</Badge>
          <CardTitle>Reading voice and voice chat</CardTitle>
          <CardDescription>
            Read uses an English voice installed on this computer and prefers a natural voice when one is present. Voice chat listens through this browser’s own speech recognition, so Chrome or Edge works best. Supertonic’s weights are OpenRAIL-M, so they stay out of the desk.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <label className="setting-field">
            Voice
            <select value={settings.voiceName} aria-label="Reading voice" onChange={(event) => patch({ voiceName: event.target.value })}>
              <option value="">A natural English voice, when this computer has one</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.name}>
                  {voice.name} · {voice.lang}
                </option>
              ))}
            </select>
          </label>
          <label className="setting-field">
            Speaking speed · {settings.voiceRate.toFixed(2)}×
            <input
              type="range"
              min={0.6}
              max={1.6}
              step={0.05}
              value={settings.voiceRate}
              aria-label="Speaking speed"
              onChange={(event) => patch({ voiceRate: Number(event.target.value) })}
            />
          </label>
          <label className="setting-field">
            Voice chat sends your words after {settings.voicePause.toFixed(1)} s of quiet
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.voicePause}
              aria-label="Pause before sending"
              onChange={(event) => patch({ voicePause: Number(event.target.value) })}
            />
          </label>
          <label className="setting-check">
            <input type="checkbox" checked={settings.voiceBargeIn} onChange={(event) => patch({ voiceBargeIn: event.target.checked })} />
            Speaking over an answer stops it and takes your turn
          </label>
          <label className="setting-check">
            <input type="checkbox" checked={settings.voiceCommands} onChange={(event) => patch({ voiceCommands: event.target.checked })} />
            Spoken Bible commands (next verse, open John 3 16, save this verse)
          </label>
          <label className="setting-field">
            Voice chat hears you through
            <select value={settings.sttMode} aria-label="Speech to text" onChange={(event) => patch({ sttMode: event.target.value as AppSettings["sttMode"] })}>
              <option value="auto">The browser, then the server when the browser cannot</option>
              <option value="browser">The browser's speech recognition (Edge, Chrome)</option>
              <option value="server">A speech-to-text server</option>
            </select>
          </label>
          {isBrave() ? <p className="quiet m-0">This is Brave, which turns off the browser's speech recognition. Use a server below, or open the desk in Edge.</p> : null}
          <label className="setting-field">
            Speech-to-text server
            <Input
              value={settings.sttUrl}
              placeholder="http://127.0.0.1:8000/v1"
              aria-label="Speech-to-text server address"
              onChange={(event) => patch({ sttUrl: event.target.value })}
            />
          </label>
          <p className="quiet m-0">
            Any server with an OpenAI-style /audio/transcriptions address: a local Whisper server you run, or a cloud service. Each spoken turn is sent there as a short WAV clip, and nothing else.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="setting-field">
              Model
              <Input value={settings.sttModel} placeholder="whisper-1" aria-label="Speech-to-text model" onChange={(event) => patch({ sttModel: event.target.value })} />
            </label>
            <label className="setting-field">
              Key, if the server needs one
              <Input type="password" value={settings.sttKey} autoComplete="off" aria-label="Speech-to-text key" onChange={(event) => patch({ sttKey: event.target.value })} />
            </label>
          </div>
          <Button type="button" variant="outline" className="justify-self-start" onClick={() => speak("The heavens declare the glory of God.")} disabled={!settings.plugins.voice}>
            Hear a line
          </Button>
        </CardContent>
      </Card>

      <Card id="set-web">
        <CardHeader>
          <Badge>Web search</Badge>
          <CardTitle>SearXNG</CardTitle>
          <CardDescription>
            Point this at your own SearXNG instance. A local server on port 8080 is reached through the desk. The agent uses it with “web …” .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <label className="setting-check">
            <input type="checkbox" checked={settings.searxOn} onChange={(event) => patch({ searxOn: event.target.checked })} />
            Enable web search
          </label>
          <label className="setting-field">
            Instance address
            <Input value={settings.searxUrl} onChange={(event) => patch({ searxUrl: event.target.value })} aria-label="SearXNG address" />
          </label>
          <label className="setting-field">
            Language
            <Input value={settings.searxLanguage} onChange={(event) => patch({ searxLanguage: event.target.value })} aria-label="Search language" />
          </label>
          <div className="gem-actions">
            <Input value={webQuery} onChange={(event) => setWebQuery(event.target.value)} aria-label="Test search" />
            <Button type="button" variant="outline" onClick={() => void tryWeb()} disabled={!settings.searxOn || !webQuery.trim()}>
              Test search
            </Button>
          </div>
          {webNote ? <p className="quiet m-0">{webNote}</p> : null}
          {webHits && webHits.length > 0 ? (
            <ul className="web-hits">
              {webHits.map((hit) => (
                <li key={hit.url}>
                  <a href={hit.url} target="_blank" rel="noreferrer">
                    {hit.title}
                  </a>
                  <small>{hit.snippet}</small>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card id="set-desk">
        <CardHeader>
          <Badge>Desk</Badge>
          <CardTitle>Feel</CardTitle>
          <CardDescription>
            Soft clicks for tabs, casting, and chat. Appearance also cycles from the topbar sun/moon button. Motion and atmosphere drift follow the system “reduce motion” setting. Sounds never leave this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="setting-list">
          <div className="setting-field theme-picker">
            <span>
              <b>Appearance</b>
              <small>Five desk looks — Staff Gold refined, plus Parchment and Ink</small>
            </span>
            <div className="theme-swatches" role="radiogroup" aria-label="Desk appearance">
              {deskThemes.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={theme === item}
                  className="theme-swatch"
                  data-theme-preview={item}
                  data-on={theme === item ? "true" : "false"}
                  onClick={() => onTheme(item)}
                >
                  <i className="theme-swatch-chip" aria-hidden="true" />
                  <strong>{deskThemeLabel(item)}</strong>
                  <small>{deskThemeHint(item)}</small>
                </button>
              ))}
            </div>
          </div>
          <label className="setting-check">
            <input type="checkbox" checked={settings.uiSound} onChange={() => patch({ uiSound: !settings.uiSound })} />
            <span>
              <b>Desk sounds</b>
              <small>Quiet Web Audio taps when you open a window, cast a chart, bookmark, or send chat</small>
            </span>
          </label>
          <label className="setting-check">
            <input
              type="checkbox"
              checked={settings.practiceCues}
              onChange={() => patch({ practiceCues: !settings.practiceCues })}
            />
            <span>
              <b>Practice voice cues</b>
              <small>Spoken correct / again / next cues on Drill and Cards, and the meditation end line — offline mp3 under Practice</small>
            </span>
          </label>
          <label className="setting-check">
            <input
              type="checkbox"
              checked={settings.chatKeepWindows}
              onChange={() => patch({ chatKeepWindows: !settings.chatKeepWindows })}
            />
            <span>
              <b>Keep windows when I chat</b>
              <small>Do not rearrange panes to open AI when you send a chat — Bible-only sessions stay put</small>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card id="set-plugins">
        <CardHeader>
          <Badge>Plugins</Badge>
          <CardTitle>Extensions</CardTitle>
          <CardDescription>
            Turn a feature off and its window leaves the desk. The Bible, books, notes, and study stay. Extra-canon, Heavens, Gematria, Strong's, Roots, and Voice match the tools on the rail.
          </CardDescription>
        </CardHeader>
        <CardContent className="setting-list">
          {pluginMeta.map((item) => (
            <label key={item.id} className="setting-check">
              <input type="checkbox" checked={settings.plugins[item.id]} onChange={() => togglePlugin(item.id)} />
              <span>
                <b>{item.title}</b>
                <small>{item.detail}</small>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card id="set-about">
        <CardHeader>
          <Badge>About</Badge>
          <CardTitle>Anointed Staff</CardTitle>
          <CardDescription>
            Anointed Staff — a local desk for Scripture and a wider spiritual walk. Word, Strong’s, Roots, Extra-canon, letters, sky, Practice (spoken guides + drills), and notes meet here for study and growth. Your work stays in this browser. How-to lives in Notes → Guide; release notes are below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="whats-new" aria-label="What’s new">
            <h3 className="whats-new-title">What’s new</h3>
            <ul className="whats-new-list">
              {whatsNew.map((entry) => {
                const release = releaseItems(entry).slice(0, entry.title.startsWith("Desk release") ? 5 : 3)
                return (
                  <li key={`${entry.date}-${entry.title}`}>
                    <p className="whats-new-entry">
                      <time dateTime={entry.date}>{entry.date}</time>
                      <strong>{entry.title}</strong>
                    </p>
                    <ul className="whats-new-bullets">
                      {release.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="licenses" aria-label="Licenses and acknowledgments">
            <h3 className="whats-new-title">Licenses & acknowledgments</h3>
            <ul className="whats-new-bullets">
              <li>
                Scripture translations on this desk are public-domain English (KJV, ASV, YLT, Darby, BBE, Douay-Rheims, and listed witnesses). Tooling lineage includes scrollmapper bible databases (MIT).
              </li>
              <li>
                Cross-references are from{" "}
                <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">
                  Open Bible
                </a>{" "}
                (CC BY). Credit Open Bible when you share study packs that include them.
              </li>
              <li>
                Extra-canon works show a per-title credit on each book (~61 library titles plus Gospels.net / Enoch / Pistis in the Extra-canon shelf). Hermetic and world shelves are historical study texts — not ritual instruction. Nag Hammadi titles use Zinner / Mattison public-domain English (not Brill/CGLP).
              </li>
              <li>
                Practice spoken guides, Hebrew letter/name clips, and the Temple walk use an offline ElevenLabs River voice baked into the build; Meditate quiet music is local Comfy YuE2 and reading quiet music is an offline instrumental. No live ElevenLabs or Comfy call while practicing or reading.
              </li>
              <li>
                UI fonts are self-hosted SIL OFL families (Outfit, Fraunces, Literata, Noto). Draw uses Excalidraw’s bundled fonts.
              </li>
              <li>
                Brand atmosphere and empty-state art are desk-generated (Comfy). Word-art plates credit fathersalphabet pending redistribution confirmation.
              </li>
            </ul>
          </div>
          <div className="donate-row">
            <img src="/donate-qr.png" alt="PayPal donation QR code" className="donate-qr" width={160} height={160} />
            <div className="grid gap-2">
              <p className="quiet m-0">Support development and maintenance. The button opens the same PayPal page as the heart on the rail.</p>
              <Button type="button" variant="outline" onClick={() => window.open(donateUrl, "_blank", "noopener")}>
                Open PayPal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
