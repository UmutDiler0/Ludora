import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Dialog, IconButton, Row, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { chatGateway } from '@/services/chat/mockChat';
import { MAX_CHAT_LENGTH, type ChatMessage } from '@/services/chat/types';
import { useChat } from '@/stores/chat';
import { HUMAN_UID, useLocalGame, useMyView } from '@/stores/localGame';
import { useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';
import { chatAccess, visibleMessages, type ChatAccess } from '../chat';

/**
 * The room, as a full-height dialog over whatever phase screen is showing.
 *
 * A dialog rather than a fourth tab (D1's tab bar is Game · Roles · Log)
 * because chat is something you do *while* looking at the game, not instead of
 * it — a tab would make you leave the vote to read an accusation about it. It
 * opens over the top and closes back to exactly where you were.
 *
 * What the room does is decided elsewhere: `chatAccess` (pure) says who may
 * speak, `ChatGateway` carries the traffic, and the store owns the unread mark.
 * This file is layout.
 *
 * Mounted once by the game layout, alongside `PeerAlert`, so the subscription
 * lives exactly as long as the session does (§37).
 */
export function ChatRoom() {
  const { t } = useI18n();
  const view = useMyView();
  const sessionId = useLocalGame((s) => s.sessionId);
  const displayName = useProfile((s) => s.displayName);

  const isOpen = useChat((s) => s.isOpen);
  const messages = useChat((s) => s.messages);
  const close = useChat((s) => s.close);
  const receive = useChat((s) => s.receive);
  const resetFor = useChat((s) => s.resetFor);
  const notePhase = useChat((s) => s.notePhase);
  const say = useChat((s) => s.say);

  const [draft, setDraft] = useState('');

  // One subscription for the whole session. Everything — including this
  // client's own messages — arrives through it. Pending bot lines are dropped
  // on the way out, so a room left mid-phase does not speak into a dead screen.
  useEffect(() => {
    const unsubscribe = chatGateway.subscribe(receive);
    return () => {
      unsubscribe();
      useChat.getState().stopChatter();
    };
  }, [receive]);

  useEffect(() => {
    resetFor(sessionId);
  }, [sessionId, resetFor]);

  // Narration and bot chatter follow the phase, not the render. `view` is a
  // fresh projection on every render, so it is held in a ref and kept out of
  // the dependency list — otherwise the room would re-narrate constantly.
  // Keyed on the round too, so night 2 is announced as well as night 1.
  const latest = useRef(view);
  latest.current = view;
  const phase = view?.phase;
  const round = view?.round;

  useEffect(() => {
    if (latest.current) notePhase(latest.current);
  }, [phase, round, notePhase]);

  const access = view ? chatAccess(view) : null;
  const shown = access ? visibleMessages(messages, access) : [];
  const titleLabel = t((s) => s.vampireVillage.chat.title);

  const send = () => {
    if (!access?.canSend) return;
    say(draft, access.channel, displayName);
    setDraft('');
  };

  return (
    <Dialog
      visible={isOpen}
      onDismiss={close}
      size="large"
      label={access ? t((s) => s.vampireVillage.chat.chatSuffix)(titleLabel[access.title]) : t((s) => s.vampireVillage.chat.chatLabel)}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // Inside a Modal, Android's window-level `adjustResize` does not apply,
        // so the composer needs to be lifted here on both platforms.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ChatHeader access={access} onClose={close} />

        <MessageList messages={shown} />

        <Composer
          access={access}
          value={draft}
          onChange={setDraft}
          onSend={send}
        />
      </KeyboardAvoidingView>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ header */

function ChatHeader({ access, onClose }: { access: ChatAccess | null; onClose: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const coven = access?.channel === 'coven';

  return (
    <Row
      gap={spacing.md}
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: stroke.base,
        borderBottomColor: palette.ink,
        backgroundColor: coven ? palette.errorContainer : palette.surfaceHigh,
      }}>
      <Ionicons
        name={coven ? 'moon' : 'chatbubbles'}
        size={20}
        color={coven ? palette.error : palette.primary}
      />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{access ? t((s) => s.vampireVillage.chat.title)[access.title] : t((s) => s.vampireVillage.chat.chatLabel)}</Text>
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {coven ? t((s) => s.vampireVillage.chat.covenOnly) : t((s) => s.vampireVillage.chat.everyoneCanRead)}
        </Text>
      </View>
      <IconButton name="close" label={t((s) => s.vampireVillage.chat.closeChat)} onPress={onClose} />
    </Row>
  );
}

/* ---------------------------------------------------------------- messages */

function MessageList({ messages }: { messages: ChatMessage[] }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const scroller = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scroller}
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: spacing.lg,
        gap: spacing.md,
        flexGrow: 1,
        justifyContent: 'flex-end',
      }}
      // New talk pins to the bottom, which is the only place a chat can sit.
      onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
      {messages.length === 0 ? (
        <Text variant="caption" color={palette.onSurfaceVariant} center>
          {t((s) => s.vampireVillage.chat.nobodySaidAnything)}
        </Text>
      ) : (
        messages.map((message) => <Bubble key={message.id} message={message} />)
      )}
    </ScrollView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { palette } = useTheme();

  if (message.system) {
    return (
      <Text variant="caption" color={palette.onSurfaceVariant} center>
        {message.body}
      </Text>
    );
  }

  const mine = message.uid === HUMAN_UID;
  const coven = message.channel === 'coven';

  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: 2 }}>
      {!mine && (
        <Text variant="label" color={coven ? palette.error : palette.onSurfaceVariant}>
          {message.displayName}
        </Text>
      )}
      <View
        style={{
          maxWidth: '86%',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: stroke.thin,
          borderColor: palette.ink,
          backgroundColor: mine
            ? palette.primaryContainer
            : coven
              ? palette.errorContainer
              : palette.surfaceHigh,
        }}>
        <Text variant="body">{message.body}</Text>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- composer */

function Composer({
  access,
  value,
  onChange,
  onSend,
}: {
  access: ChatAccess | null;
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();

  // Locked rooms say why rather than showing a dead input. "You cannot type
  // here" is a bug report; "the village is asleep" is a game rule.
  if (!access?.canSend) {
    return (
      <View
        style={{
          padding: spacing.lg,
          borderTopWidth: stroke.base,
          borderTopColor: palette.ink,
          backgroundColor: palette.surfaceLow,
        }}>
        <Row gap={spacing.sm}>
          <Ionicons name="lock-closed" size={16} color={palette.onSurfaceVariant} />
          <Text variant="caption" color={palette.onSurfaceVariant} style={{ flex: 1 }}>
            {access?.notice ? t((s) => s.vampireVillage.chat.notice)[access.notice] : t((s) => s.vampireVillage.chat.chatClosed)}
          </Text>
        </Row>
      </View>
    );
  }

  const ready = value.trim().length > 0;

  return (
    <Row
      gap={spacing.sm}
      style={{
        padding: spacing.md,
        borderTopWidth: stroke.base,
        borderTopColor: palette.ink,
        backgroundColor: palette.surfaceLow,
        alignItems: 'flex-end',
      }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={access.channel === 'coven' ? t((s) => s.vampireVillage.chat.speakToCoven) : t((s) => s.vampireVillage.chat.saySomething)}
        placeholderTextColor={palette.onSurfaceVariant}
        maxLength={MAX_CHAT_LENGTH}
        multiline
        // Enter sends; the composer is one line of table talk, not an essay.
        blurOnSubmit
        returnKeyType="send"
        onSubmitEditing={onSend}
        accessibilityLabel={t((s) => s.vampireVillage.chat.message)}
        style={{
          flex: 1,
          maxHeight: 96,
          minHeight: 44,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          borderRadius: radius.md,
          borderWidth: stroke.thin,
          borderColor: palette.ink,
          backgroundColor: palette.surface,
          color: palette.onSurface,
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t((s) => s.vampireVillage.chat.sendMessage)}
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={onSend}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: stroke.base,
          borderColor: palette.ink,
          backgroundColor: ready ? palette.primary : palette.surfaceHigh,
          opacity: pressed ? 0.85 : 1,
        })}>
        <Ionicons
          name="send"
          size={18}
          color={ready ? palette.onPrimary : palette.onSurfaceVariant}
        />
      </Pressable>
    </Row>
  );
}
