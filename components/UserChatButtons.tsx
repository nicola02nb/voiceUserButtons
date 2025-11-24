/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./UserChatButtons.css";

import { openPrivateChannel } from "@utils/discord";
import { Icon, User } from "@vencord/discord-types";
import { findByPropsLazy, findComponentByCodeLazy, findStoreLazy } from "@webpack";
import { NavigationRouter, Tooltip, UserStore } from "@webpack/common";
import { JSX } from "react";

import { settings } from "../settings";
import { Button } from "@components/Button";

const MediaEngineStore = findStoreLazy("MediaEngineStore");
const SoundboardStore = findStoreLazy("SoundboardStore");
const ClientActions: {
    toggleSelfMute: () => void;
    toggleSelfDeaf: () => void;
    toggleLocalMute: (userId: string) => void;
    toggleLocalSoundboardMute: (userId: string) => void;
    setDisableLocalVideo: (userId: string, state: string, def: string) => void;
} = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf", "toggleLocalMute", "toggleLocalSoundboardMute", "setDisableLocalVideo");

function VoiceUserButton({ user, tooltip, icon, onClick }: { user: User; tooltip: string; icon: JSX.Element; onClick: () => void; }) {
    const isCurrent = (user.id === UserStore.getCurrentUser().id);
    if (isCurrent && settings.store.showButtonsSelf === "hide") return null;
    const disabled = isCurrent && settings.store.showButtonsSelf === "disable";
    return (
        <div className="voice-user-button-container">
            <Tooltip text={tooltip} shouldShow={!disabled}>
                {({ onMouseEnter, onMouseLeave }) => (
                    <Button
                        size={"min"}
                        variant="none"
                        disabled={disabled}
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClick();
                        }}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    >
                        {icon}
                    </Button>
                )}
            </Tooltip>
        </div>
    );
}

function getUserName(user: User) {
    const username = `@${user.username}`;
    if (settings.store.whichNameToShow === "global") {
        return user.globalName ?? username;
    } else if (settings.store.whichNameToShow === "nickname") {
        return username;
    } else if (settings.store.whichNameToShow === "both" && user.globalName) {
        return `${user.globalName} / ${username}`;
    }
    return username;
}

const ChatIcon = findComponentByCodeLazy(".css,d:\"M12 22a10") as Icon;
export function UserChatButton({ user }: { user: User; }) {
    const isCurrent = (user.id === UserStore.getCurrentUser().id);
    return (
        <VoiceUserButton
            user={user}
            tooltip={isCurrent ? "Navigate to DMs" : `Open DMs with ${getUserName(user)}`}
            icon={<ChatIcon size="sm" />}
            onClick={() => {
                if (isCurrent) {
                    NavigationRouter.transitionTo("/users/@me/");
                    return;
                }
                openPrivateChannel({ recipientIds: [user.id] } as any); // TODO: fix types
            }}
        />
    );
}

const MuteIconSelf = findComponentByCodeLazy("d:\"m2.7 22.7 20-20a1", "1.4ZM10.8") as Icon;
const MuteIconOther = findComponentByCodeLazy("M21.76.83a5.02", "M12 2c.33 0") as Icon;
export function UserMuteButton({ user }: { user: User; }) {
    const isCurrent = (user.id === UserStore.getCurrentUser().id);
    const isMuted = (isCurrent && MediaEngineStore.isSelfMute()) || MediaEngineStore.isLocalMute(user.id);
    const color = isMuted ? "var(--status-danger)" : "var(--channels-default)";
    return (
        <VoiceUserButton
            user={user}
            tooltip={`${isMuted ? "Unmute" : "Mute"} ${isCurrent ? "yourself" : `${getUserName(user)}`}`}
            icon={isCurrent ? <MuteIconSelf muted={isMuted} size="sm" color={color} /> : <MuteIconOther muted={isMuted} size="sm" color={color} />}
            onClick={() => {
                if (isCurrent) {
                    ClientActions.toggleSelfMute();
                    return;
                }
                ClientActions.toggleLocalMute(user.id);
            }}
        />
    );
}

const DeafenIconSelf = findComponentByCodeLazy("M22.7 2.7a1", "1.4l20-20ZM17") as Icon;
const DeafenIconOther = findComponentByCodeLazy("M21.76.83a5.02", "M12.38") as Icon;
export function UserDeafenButton({ user }: { user: User; }) {
    const isCurrent = (user.id === UserStore.getCurrentUser().id);
    const isDeafened = isCurrent && MediaEngineStore.isSelfDeaf() || MediaEngineStore.isLocalMute(user.id) && SoundboardStore.isLocalSoundboardMuted(user.id) && MediaEngineStore.isLocalVideoDisabled(user.id);
    const color = isDeafened ? "var(--status-danger)" : "var(--channels-default)";
    return (
        <VoiceUserButton
            user={user}
            tooltip={`${isDeafened ? "Undeafen" : "Deafen"} ${isCurrent ? "yourself" : `${getUserName(user)}`}`}
            icon={isCurrent ? <DeafenIconSelf muted={isDeafened} size="sm" color={color} /> : <DeafenIconOther muted={isDeafened} size="sm" color={color} />}
            onClick={() => {
                if (isCurrent) {
                    ClientActions.toggleSelfDeaf();
                    return;
                }
                ClientActions.toggleLocalMute(user.id);
                if (settings.store.muteSoundboard) {
                    ClientActions.toggleLocalSoundboardMute(user.id);
                }
                if (settings.store.disableVideo) {
                    ClientActions.setDisableLocalVideo(
                        user.id,
                        MediaEngineStore.isLocalVideoDisabled(user.id) ? "ENABLED" : "DISABLED",
                        "default"
                    );
                }
            }}
        />
    );
}
