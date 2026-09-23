"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Skull, Swords, X, Upload, Check, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createTeamAction,
  sendJoinRequestAction,
  acceptJoinRequestAction,
  rejectJoinRequestAction,
  cancelJoinRequestAction,
  voluntaryLeaveTeamAction,
} from './actions';
import type { LedgerEvent } from '@/lib/ledger';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  branch: string;
  batchYear: number;
  rollNumber: string;
}

interface JoinRequestUser {
  id: string;
  name: string | null;
  email: string;
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: string;
}

interface IncomingJoinRequest {
  id: string;
  user: JoinRequestUser;
  createdAt: Date;
}

interface OutgoingJoinRequest {
  id: string;
  team: {
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    _count: { members: number };
  };
  createdAt: Date;
}

interface AvailableTeam {
  id: string;
  name: string;
  batchTier: string;
  isFrozen: boolean;
  memberCount: number;
  hasRequested: boolean;
  requestId?: string;
}

interface DashboardUser {
  id: string;
  email: string;
  name: string | null;
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: string;
  isFirstYear: boolean;
  teamId: string | null;
  team: {
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    avatarUrl: string | null;
    members: TeamMember[];
    joinRequests: IncomingJoinRequest[];
  } | null;
  joinRequests: OutgoingJoinRequest[];
}

interface DashboardClientProps {
  user: DashboardUser;
  availableTeams: AvailableTeam[];
  pointHistory: LedgerEvent[];
  scoreSummary: {
    score: number;
    totalGained: number;
    totalPenalties: number;
    totalAdjustments: number;
  };
}

export default function DashboardClient({
  user,
  availableTeams,
  pointHistory,
  scoreSummary,
}: DashboardClientProps) {
  const [teamName, setTeamName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.length < 3 || teamName.length > 30) return;
    setActionPending('create');
    await createTeamAction(teamName);
    setActionPending(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/team/avatar', {
        method: 'POST',
        body: formData,
      });
      // Optionally refresh router here
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  if (user.team) {
    const { team } = user;
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-voyage-ocean/20 border-2 border-voyage-gold/30 rounded-xl p-6 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-voyage-gold bg-voyage-abyss flex items-center justify-center">
                {preview || team.avatarUrl ? (
                  <img src={preview || team.avatarUrl || ''} alt="Jolly Roger" className="w-full h-full object-cover" />
                ) : (
                  <Skull className="w-12 h-12 text-voyage-gold/50" />
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Upload className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-code">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-4xl sm:text-5xl font-pirata text-voyage-gold mb-2">{team.name}</h1>
              <span className="inline-block px-3 py-1 bg-voyage-gold/10 border border-voyage-gold/50 rounded-full text-sm font-code text-voyage-gold-light">
                Tier: {team.batchTier}
              </span>
              {team.isFrozen && (
                <span className="inline-block ml-2 px-3 py-1 bg-voyage-crimson/10 border border-voyage-crimson/50 rounded-full text-sm font-code text-voyage-crimson">
                  Frozen
                </span>
              )}
            </div>
            {!team.isFrozen && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to abandon ship?')) {
                    setActionPending('leave');
                    await voluntaryLeaveTeamAction();
                    setActionPending(null);
                  }
                }}
                disabled={actionPending === 'leave'}
                className="px-4 py-2 bg-voyage-crimson/20 border-2 border-voyage-crimson text-voyage-crimson font-code rounded hover:bg-voyage-crimson/30 transition-colors disabled:opacity-50"
              >
                Abandon Ship
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreCard icon={<Coins />} label="Bounty" value={scoreSummary.score} color="text-voyage-gold" />
          <ScoreCard icon={<Swords />} label="Plunder" value={scoreSummary.totalGained} color="text-green-400" />
          <ScoreCard icon={<Skull />} label="Curses" value={scoreSummary.totalPenalties} color="text-voyage-crimson" />
          <ScoreCard icon={<Compass />} label="Tides" value={scoreSummary.totalAdjustments} color="text-blue-400" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-pirata text-voyage-parchment border-b border-voyage-gold/20 pb-2">The Crew</h2>
            <div className="space-y-3">
              {team.members.map((m) => (
                <div key={m.id} className="p-4 bg-voyage-oak/40 border border-voyage-gold/20 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-bold text-voyage-parchment-dark text-lg">{m.name || 'Anonymous Sailor'}</div>
                    <div className="text-sm text-voyage-parchment/60 font-code">{m.email.split('@')[0]} • {m.branch} &apos;{m.batchYear}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!team.isFrozen && team.members.length < 3 && team.joinRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-pirata text-voyage-parchment border-b border-voyage-gold/20 pb-2">Parley Requests</h2>
              <div className="space-y-3">
                {team.joinRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-voyage-ocean/20 border border-voyage-gold/20 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-voyage-parchment-dark">{req.user.name || 'Sailor'}</div>
                      <div className="text-xs text-voyage-parchment/60 font-code">{req.user.branch} &apos;{req.user.batchYear}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptJoinRequestAction(req.id)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => rejectJoinRequestAction(req.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-pirata text-voyage-parchment border-b border-voyage-gold/20 pb-2">Ship&apos;s Log</h2>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {pointHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-voyage-abyss/50 border border-voyage-gold/10 rounded">
                <span className="font-code text-sm text-voyage-parchment/80">{entry.title || entry.reason}</span>
                <span className={cn("font-code text-sm font-bold", entry.amount >= 0 ? "text-green-400" : "text-voyage-crimson")}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </span>
              </div>
            ))}
            {pointHistory.length === 0 && (
              <div className="text-center p-4 text-voyage-parchment/50 font-code italic">The log is empty...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No Team - Recruitment Hall
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-pirata text-voyage-gold mb-4">Recruitment Hall</h1>
        <p className="text-voyage-parchment/80 font-code">Form your own crew or join an existing vessel before setting sail.</p>
      </div>

      <div className="bg-voyage-ocean/20 border-2 border-voyage-gold/30 rounded-xl p-6 sm:p-8 max-w-md mx-auto">
        <h2 className="text-2xl font-pirata text-voyage-gold-light mb-4">Commission a Ship</h2>
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter Ship Name..."
              className="w-full bg-voyage-abyss border border-voyage-gold/30 rounded px-4 py-3 font-code text-voyage-parchment focus:outline-none focus:border-voyage-gold transition-colors text-base"
              minLength={3}
              maxLength={30}
              required
            />
          </div>
          <button
            type="submit"
            disabled={actionPending === 'create' || teamName.length < 3}
            className="w-full bg-voyage-gold text-voyage-oak font-pirata text-xl py-3 rounded hover:bg-voyage-gold-light transition-colors disabled:opacity-50"
          >
            {actionPending === 'create' ? 'Building...' : 'Hoist the Flag'}
          </button>
        </form>
      </div>

      {user.joinRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-pirata text-voyage-parchment border-b border-voyage-gold/20 pb-2">Pending Dispatches</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user.joinRequests.map((req) => (
              <div key={req.id} className="p-4 bg-voyage-oak/40 border border-voyage-gold/20 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-voyage-gold">{req.team.name}</div>
                  <div className="text-sm text-voyage-parchment/60 font-code text-xs mt-1">Sent: {new Date(req.createdAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => cancelJoinRequestAction(req.id)}
                  className="px-3 py-1 bg-voyage-crimson/20 text-voyage-crimson border border-voyage-crimson/50 rounded font-code text-sm hover:bg-voyage-crimson/30"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-pirata text-voyage-parchment border-b border-voyage-gold/20 pb-2">Available Vessels</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableTeams.map((t) => (
            <div key={t.id} className="p-5 bg-voyage-ocean/10 border border-voyage-gold/20 rounded-lg hover:border-voyage-gold/50 transition-colors flex flex-col justify-between h-full">
              <div>
                <h3 className="font-pirata text-xl text-voyage-parchment-dark truncate">{t.name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-voyage-gold/10 text-voyage-gold font-code text-xs rounded border border-voyage-gold/30">Tier: {t.batchTier}</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 font-code text-xs rounded border border-blue-500/30">{t.memberCount}/3 Crew</span>
                </div>
              </div>
              <div className="mt-4">
                {t.hasRequested ? (
                  <button disabled className="w-full py-2 bg-voyage-gold/10 text-voyage-gold/50 font-code text-sm rounded border border-voyage-gold/20">
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => sendJoinRequestAction(t.id)}
                    className="w-full py-2 bg-voyage-gold/20 hover:bg-voyage-gold/30 text-voyage-gold font-code text-sm rounded border border-voyage-gold/50 transition-colors"
                  >
                    Request to Join
                  </button>
                )}
              </div>
            </div>
          ))}
          {availableTeams.length === 0 && (
            <div className="col-span-full py-12 text-center text-voyage-parchment/50 font-code">
              No available vessels currently seeking crew in your tier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="bg-voyage-oak/40 border border-voyage-gold/30 rounded-lg p-4 flex flex-col items-center justify-center text-center">
      <div className={cn("mb-2 w-8 h-8", color)}>
        {icon}
      </div>
      <div className="text-3xl font-pirata text-voyage-parchment mb-1">{value}</div>
      <div className="text-xs font-code text-voyage-parchment/60 uppercase tracking-wider">{label}</div>
    </div>
  );
}
