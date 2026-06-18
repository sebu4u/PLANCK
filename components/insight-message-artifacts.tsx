'use client';

import type { InsightMessageArtifact } from '@/lib/insight/agent/types';
import { PlanckResourceCard } from '@/components/planck-resource-card';

export default function InsightMessageArtifacts({
  artifacts,
  light = false,
  singleColumn = false,
}: {
  artifacts?: InsightMessageArtifact[] | null;
  light?: boolean;
  singleColumn?: boolean;
}) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {artifacts.map((artifact, index) => {
        if (artifact.type === 'resource_references' && artifact.resources.length > 0) {
          return (
            <div key={`resources-${index}`} className="space-y-2">
              {artifact.title ? (
                <div className={light ? 'text-xs font-medium uppercase tracking-wide text-[#64748b]' : 'text-xs font-medium uppercase tracking-wide text-gray-500'}>
                  {artifact.title}
                </div>
              ) : null}
              <div className={singleColumn ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-2'}>
                {artifact.resources.map((resource) => (
                  <PlanckResourceCard
                    key={`${resource.type}-${resource.id}-${resource.url}`}
                    resource={resource}
                    light={light}
                  />
                ))}
              </div>
            </div>
          );
        }

        if (artifact.type === 'agent_action') {
          return (
            <div
              key={`action-${index}`}
              className={
                light
                  ? 'rounded-md border border-[#0b0d10]/12 bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a]'
                  : 'rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-200'
              }
            >
              <span className="font-medium">{artifact.title}</span>
              <span className={light ? 'ml-2 text-xs text-[#64748b]' : 'ml-2 text-xs text-gray-500'}>{artifact.status}</span>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
