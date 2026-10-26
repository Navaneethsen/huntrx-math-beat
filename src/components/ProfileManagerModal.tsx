import React, { useState } from 'react';
import { X, Users, RotateCcw, Trash2, UserPlus, Check } from 'lucide-react';
import { Language, Translations } from '../i18n/translations';
import {
  PlayerProfile,
  getLevelInfo,
  getStageNumber,
} from '../engine/progressionStore';
import { HunterAvatar } from './CharacterArt';

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  t: Translations;
  profiles: PlayerProfile[];
  activeProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onCreateNewRequest: () => void;
  onResetProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
}

export const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
  isOpen,
  onClose,
  lang,
  t,
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateNewRequest,
  onResetProfile,
  onDeleteProfile,
}) => {
  const [confirmAction, setConfirmAction] = useState<{
    profileId: string;
    type: 'reset' | 'delete';
  } | null>(null);

  if (!isOpen) return null;

  return (
    <div
      data-testid="profile-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="light-surface-card relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#1f0d3d] to-[#0f0520] border-2 border-fuchsia-400/60 rounded-3xl p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(232,121,249,0.4)]">
        <button
          type="button"
          data-testid="close-profile-modal-btn"
          onClick={onClose}
          className="light-pill-btn absolute top-4 right-4 p-2 rounded-full bg-purple-900/70 hover:bg-purple-800 text-purple-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-amber-400 flex items-center justify-center text-slate-950 shadow">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-amber-300">
              {t.profiles.modalTitle}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">{t.profiles.modalSubtitle}</p>
          </div>
        </div>

        {/* List of Saved Profiles */}
        <div className="space-y-3 mb-5">
          {profiles.map((prof) => {
            const isActive = prof.id === activeProfileId;
            const lv = getLevelInfo(prof.progress.xp, lang);
            const stageNum = getStageNumber(prof.skill, prof.sealSize);
            const hInfo = t.hunters[prof.hunter];
            const isConfirmingReset =
              confirmAction?.profileId === prof.id && confirmAction?.type === 'reset';
            const isConfirmingDelete =
              confirmAction?.profileId === prof.id && confirmAction?.type === 'delete';

            return (
              <div
                key={prof.id}
                data-testid={`profile-card-${prof.name}`}
                className={`rounded-2xl p-3.5 border-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-fuchsia-950/90 via-purple-900/80 to-indigo-950/90 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'bg-purple-950/50 border-purple-700/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    onClick={() => {
                      onSelectProfile(prof.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <HunterAvatar hunter={prof.hunter} size={52} animate={isActive} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-black text-base sm:text-lg text-white">
                          {prof.name}
                        </span>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-pink-500/25 border border-pink-400/50 text-pink-200">
                          {hInfo.name}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                            {t.profiles.activeBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-300 font-bold mt-0.5">
                        {t.welcomeBack.currentStageBadge(stageNum)}: {t.skills[prof.skill].name} •{' '}
                        {t.orbsCount(prof.sealSize)}
                      </div>
                      <div className="text-[11px] text-purple-200/80 mt-0.5">
                        Lv.{lv.level} • 💎 {prof.progress.gems} • 🃏{' '}
                        {prof.progress.unlockedCards.length}/12 •{' '}
                        {t.profiles.stagesClearedLabel(prof.stagesCleared)}
                      </div>
                    </div>
                  </div>

                  {/* Profile Actions: Select, Reset, Delete */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(prof.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 font-display font-black text-xs flex items-center gap-1 shadow hover:brightness-110"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t.profiles.selectBtn}
                      </button>
                    )}

                    {!isConfirmingReset && !isConfirmingDelete && (
                      <>
                        <button
                          type="button"
                          data-testid={`reset-profile-${prof.name}`}
                          onClick={() =>
                            setConfirmAction({ profileId: prof.id, type: 'reset' })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                          <span>{t.profiles.resetProgressBtn}</span>
                        </button>
                        <button
                          type="button"
                          data-testid={`delete-profile-${prof.name}`}
                          onClick={() =>
                            setConfirmAction({ profileId: prof.id, type: 'delete' })
                          }
                          className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1"
                          title={t.profiles.deletePlayerBtn}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {isConfirmingReset && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid={`confirm-reset-${prof.name}`}
                          onClick={() => {
                            onResetProfile(prof.id);
                            setConfirmAction(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-display font-black text-xs"
                        >
                          {t.profiles.confirmResetBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          {t.profiles.cancelBtn}
                        </button>
                      </div>
                    )}

                    {isConfirmingDelete && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid={`confirm-delete-${prof.name}`}
                          onClick={() => {
                            onDeleteProfile(prof.id);
                            setConfirmAction(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-display font-black text-xs"
                        >
                          {t.profiles.confirmDeleteBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          {t.profiles.cancelBtn}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Player Button */}
        <button
          type="button"
          data-testid="modal-create-new-player-btn"
          onClick={() => {
            onClose();
            onCreateNewRequest();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 text-slate-950 font-display font-black text-sm sm:text-base shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:brightness-110 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>{t.profiles.newPlayerBtn}</span>
        </button>
      </div>
    </div>
  );
};
