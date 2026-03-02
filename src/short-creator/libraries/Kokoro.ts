import { KokoroTTS, TextSplitterStream } from "kokoro-js";
import {
  VoiceEnum,
  type kokoroModelPrecision,
  type Voices,
} from "../../types/shorts";
import { KOKORO_MODEL, logger } from "../../config";

import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

export class Kokoro {
  constructor(private tts: KokoroTTS) { }

  async generate(
    text: string,
    voice: Voices,
  ): Promise<{
    audio: Buffer;
    audioLength: number;
  }> {
    const isSpanish = ["ef_dora", "em_alex", "em_santa"].includes(voice);
    const output = [];

    if (isSpanish) {
      try {
        // kokoro-js phonemizer does not support Spanish text correctly.
        // We use espeak-ng CLI directly to convert Spanish text to IPA phonemes.
        // Preserve punctuation for Kokoro pacing by splitting text into chunks
        const tokens = text.match(/[^.,!?¿¡;:\n]+|[.,!?¿¡;:\n]+/g) || [];
        let ipaText = "";

        for (const token of tokens) {
          if (/^[.,!?¿¡;:\n]+$/.test(token)) {
            ipaText += token;
          } else if (token.trim() === "") {
            ipaText += token;
          } else {
            const safeText = token.replace(/"/g, '\\"').trim();
            if (safeText) {
              const { stdout } = await execAsync(
                `espeak-ng -v es --ipa -q "${safeText}"`
              );
              // espeak-ng returns words separated by newlines, we replace them with spaces
              const phonemized = stdout.trim().replace(/\n/g, ' ');
              const leadingSpace = token.match(/^\s*/)?.[0] || '';
              const trailingSpace = token.match(/\s*$/)?.[0] || '';
              ipaText += leadingSpace + phonemized + trailingSpace;
            } else {
              ipaText += token;
            }
          }
        }

        ipaText = ipaText.replace(/\s+/g, ' ').trim();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ttsInstance = this.tts as any;
        const { input_ids } = ttsInstance.tokenizer(ipaText, {
          truncation: true,
        });
        const audioResult = await ttsInstance.generate_from_ids(input_ids, {
          voice,
        });

        output.push({ audio: audioResult });
      } catch (error) {
        logger.error(
          { error, text, voice },
          "Failed to generate Spanish phonemes with espeak-ng",
        );
        throw error;
      }
    } else {
      const splitter = new TextSplitterStream();
      const stream = this.tts.stream(splitter, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        voice: voice as any,
      });
      splitter.push(text);
      splitter.close();

      for await (const audio of stream) {
        output.push(audio);
      }
    }

    const audioBuffers: ArrayBuffer[] = [];
    let audioLength = 0;
    for (const audio of output) {
      audioBuffers.push(audio.audio.toWav());
      audioLength += audio.audio.audio.length / audio.audio.sampling_rate;
    }

    const mergedAudioBuffer = Kokoro.concatWavBuffers(audioBuffers);
    logger.debug({ text, voice, audioLength }, "Audio generated with Kokoro");

    return {
      audio: mergedAudioBuffer,
      audioLength: audioLength,
    };
  }

  static concatWavBuffers(buffers: ArrayBuffer[]): Buffer {
    const first = Buffer.from(buffers[0]);
    const header = Buffer.from(first.subarray(0, 44));
    let totalDataLength = 0;

    const dataParts = buffers.map((buf) => {
      const data = Buffer.from(buf).subarray(44);
      totalDataLength += data.length;
      return data;
    });

    header.writeUInt32LE(36 + totalDataLength, 4);
    header.writeUInt32LE(totalDataLength, 40);

    return Buffer.concat([header, ...dataParts]);
  }

  static async init(dtype: kokoroModelPrecision): Promise<Kokoro> {
    const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
      dtype,
      device: "cpu", // only "cpu" is supported in node
    });

    // kokoro-js npm package does not include Spanish voices (ef_dora, em_alex,
    // em_santa) in its internal validation map (which is Object.frozen).
    // We patch _validate_voice on the instance so it accepts Spanish voice IDs.
    // The voice .bin files are downloaded from HuggingFace on first use,
    // exactly like English voices — only the validation needs to be bypassed.
    const spanishVoices: Set<string> = new Set(Object.values(VoiceEnum));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = tts as any;
    const originalValidate = instance._validate_voice.bind(instance);
    instance._validate_voice = (voice: string) => {
      if (spanishVoices.has(voice)) {
        // Return the first character as the original does (language prefix)
        return voice.at(0);
      }
      return originalValidate(voice);
    };

    logger.info(
      { voices: [...spanishVoices] },
      "Spanish voices registered in Kokoro",
    );

    return new Kokoro(tts);
  }

  listAvailableVoices(): Voices[] {
    const voices = Object.values(VoiceEnum) as Voices[];
    return voices;
  }
}
