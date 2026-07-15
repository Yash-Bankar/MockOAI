"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Badge,
  GradeStamp,
  Input,
  Select,
  Modal,
} from "@/components/ui";

const selectOptions = [
  { value: "", label: "Select an option…" },
  { value: "mcq", label: "MCQ" },
  { value: "coding", label: "Coding" },
  { value: "mixed", label: "Mixed" },
];

export default function StyleGuidePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-14">
      {/* Header */}
      <header>
        <h1 className="font-[family-name:var(--font-archivo-black)] text-4xl text-ink">
          Style Guide
        </h1>
        <p className="mt-2 text-lg text-ink/70 font-[family-name:var(--font-space-grotesk)]">
          MockOA design system — Neo-Brutalism theme. Every component and
          variant rendered below for visual QA.
        </p>
      </header>

      {/* ─── TOKENS ─────────────────────────────────────────────────── */}
      <Section title="Color Tokens">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Swatch name="--paper" bg="bg-paper" />
          <Swatch name="--paper-alt" bg="bg-paper-alt" />
          <Swatch name="--ink" bg="bg-ink" text="text-paper" />
          <Swatch name="--red-pen" bg="bg-red-pen" text="text-white" />
          <Swatch name="--highlighter" bg="bg-highlighter" />
          <Swatch name="--pass-green" bg="bg-pass-green" text="text-white" />
          <Swatch name="--cobalt" bg="bg-cobalt" text="text-white" />
        </div>
      </Section>

      {/* ─── TYPOGRAPHY ─────────────────────────────────────────────── */}
      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-ink/50 uppercase tracking-wider">
              Archivo Black — Headlines
            </span>
            <h2 className="font-[family-name:var(--font-archivo-black)] text-3xl text-ink">
              The quick brown fox jumps over the lazy dog
            </h2>
          </div>
          <div>
            <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-ink/50 uppercase tracking-wider">
              Space Grotesk — Body / UI
            </span>
            <p className="text-lg font-[family-name:var(--font-space-grotesk)] text-ink">
              The quick brown fox jumps over the lazy dog. Used for all
              body text, labels, and interface copy.
            </p>
          </div>
          <div>
            <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-ink/50 uppercase tracking-wider">
              JetBrains Mono — Scores / Stats / Ranks
            </span>
            <p className="text-2xl font-[family-name:var(--font-jetbrains-mono)] text-ink font-bold">
              87 / 125 &nbsp; Rank #42 &nbsp; 03:45
            </p>
          </div>
        </div>
      </Section>

      {/* ─── BUTTONS ────────────────────────────────────────────────── */}
      <Section title="Buttons">
        <div className="flex flex-col gap-6">
          {/* Variants */}
          <div>
            <Subheading>Variants</Subheading>
            <div className="flex flex-wrap items-end gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <Subheading>Sizes</Subheading>
            <div className="flex flex-wrap items-end gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Disabled */}
          <div>
            <Subheading>Disabled</Subheading>
            <div className="flex flex-wrap items-end gap-4">
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <Button variant="danger" disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Stamp-press hint */}
          <div>
            <Subheading>Stamp-Press Interaction</Subheading>
            <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)] mb-3">
              Click and hold any button — it translates (4px, 4px) and the
              shadow disappears, simulating a stamp press.
            </p>
            <Button variant="primary">Press me</Button>
          </div>
        </div>
      </Section>

      {/* ─── CARDS ──────────────────────────────────────────────────── */}
      <Section title="Cards">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <h3 className="font-[family-name:var(--font-archivo-black)] text-lg text-ink mb-2">
              Default Card
            </h3>
            <p className="text-sm font-[family-name:var(--font-space-grotesk)] text-ink/70">
              3px ink border, 6px 6px 0 hard shadow, 4px radius. Flat
              single-color fill.
            </p>
          </Card>

          <Card tilt={-2}>
            <h3 className="font-[family-name:var(--font-archivo-black)] text-lg text-ink mb-2">
              Tilted Card (-2°)
            </h3>
            <p className="text-sm font-[family-name:var(--font-space-grotesk)] text-ink/70">
              Pass a tilt prop for slight rotation. Varies per instance.
            </p>
          </Card>

          <Card tilt={3} className="bg-paper-alt">
            <h3 className="font-[family-name:var(--font-archivo-black)] text-lg text-ink mb-2">
              Alt + Tilted (3°)
            </h3>
            <p className="text-sm font-[family-name:var(--font-space-grotesk)] text-ink/70">
              Combine tilt with bg-paper-alt for variety.
            </p>
          </Card>
        </div>
      </Section>

      {/* ─── BADGES & GRADE STAMPS ─────────────────────────────────── */}
      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>Default</Badge>
          <Badge variant="success">Pass</Badge>
          <Badge variant="danger">Fail</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      </Section>

      <Section title="GradeStamps">
        <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)] mb-4">
          The signature component — rotated, thick-bordered. Each instance
          rotates between -6° and 4° by default, or you can pass an explicit
          rotate prop.
        </p>
        <div className="flex flex-wrap items-center gap-8 py-4">
          <GradeStamp variant="pass" rotate={-4}>
            PASSED
          </GradeStamp>
          <GradeStamp variant="fail" rotate={3}>
            FAILED
          </GradeStamp>
          <GradeStamp variant="rank" rotate={-1}>
            Rank #7
          </GradeStamp>
          <GradeStamp variant="info" rotate={5}>
            NEW
          </GradeStamp>
          <GradeStamp variant="neutral" rotate={-3}>
            ATTEMPTED
          </GradeStamp>
        </div>
      </Section>

      {/* ─── FORM ELEMENTS ─────────────────────────────────────────── */}
      <Section title="Form Elements">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <Input label="Full Name" placeholder="Enter your name" />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error="This field is required"
          />
          <Input label="Disabled" placeholder="Can't touch this" disabled />
          <Select label="Question Format" options={selectOptions} />
        </div>
      </Section>

      {/* ─── MODAL ──────────────────────────────────────────────────── */}
      <Section title="Modal">
        <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)] mb-4">
          For confirmation dialogs (e.g., &quot;Submit exam?&quot;). Escape
          key and backdrop click dismiss it.
        </p>
        <Button variant="danger" onClick={() => setModalOpen(true)}>
          Open Modal
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Submit Exam?"
          actions={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>
                Confirm Submit
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to submit? You have 12 minutes remaining.
            This action cannot be undone.
          </p>
        </Modal>
      </Section>

      {/* ─── SHADOW LANGUAGE ────────────────────────────────────────── */}
      <Section title="Shadow Language">
        <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)] mb-4">
          Every interactive surface uses{" "}
          <code className="font-[family-name:var(--font-jetbrains-mono)] text-sm bg-paper-alt px-1.5 py-0.5 border-2 border-ink rounded-[2px]">
            6px 6px 0 var(--ink)
          </code>{" "}
          — zero blur, hard offset. On :active, the shadow is removed and the
          element translates to fill the gap.
        </p>
        <div className="flex flex-wrap gap-6">
          <div className="w-32 h-32 bg-highlighter border-[3px] border-ink rounded-[4px] shadow-brutal flex items-center justify-center text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
            Resting
          </div>
          <div className="w-32 h-32 bg-paper border-[3px] border-ink rounded-[4px] flex items-center justify-center text-sm font-bold font-[family-name:var(--font-space-grotesk)] translate-x-[4px] translate-y-[4px]">
            Active (simulated)
          </div>
        </div>
      </Section>
    </main>
  );
}

/* ─── Helper components ──────────────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-archivo-black)] text-2xl text-ink mb-5 border-b-[3px] border-ink pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold font-[family-name:var(--font-jetbrains-mono)] text-ink/50 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

function Swatch({
  name,
  bg,
  text = "text-ink",
}: {
  name: string;
  bg: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`${bg} ${text} h-16 border-[3px] border-ink rounded-[4px] flex items-center justify-center text-xs font-bold font-[family-name:var(--font-jetbrains-mono)]`}
      >
        {name}
      </div>
    </div>
  );
}
