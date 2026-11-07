/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { User } from "@vencord/discord-types";
import { React } from "@webpack/common";

import { UserChatButton, UserDeafenButton, UserMuteButton } from "./components/UserChatButtons";
import { settings } from "./settings";
import { Flex } from "@components/Flex";

export default definePlugin({
    name: "VoiceUserButtons",
    description: "Quickly DM, mute, or deafen any user right from the voice-call panel.",
    authors: [{ name: "nicola02nb", id: 257900031351193600n }, { name: "omaw", id: 1155026301791514655n }],
    settings,
    patches: [
        {
            find: "(\"VoiceUser\")",
            replacement: {
                match: /(function\((\i)\){let .+?flipped:(\i),.+?\[\i\.\i\]:\3}\),children:\[)/,
                replace: "$1$self.renderButtons($2),"
            }
        }
    ],
    renderButtons(props?: any) {
        if (!props || props.collapsed || !props.user) return null;
        const user: User = props.user;
        return (
            <Flex flexDirection={"row"} className="voice-user-buttons">
                {settings.store.showChatButton && <UserChatButton user={user} />}
                {settings.store.showMuteButton && <UserMuteButton user={user} />}
                {settings.store.showDeafenButton && <UserDeafenButton user={user} />}
            </Flex>
        );
    }
});
