import { config } from "dotenv";
import BotFather from "../base/BotFather";
import { Message, ReplyKeyboardMarkup } from "node-telegram-bot-api";
import { REGEX } from "../../utils/constant";
import Spotify from "spotifydl-core";
import SpotifyFetcher from "spotifydl-core/dist/Spotify";
import Playlist from "spotifydl-core/dist/lib/details/Playlist";

config();

export class PikaSpotify extends BotFather {
    private readonly spotify: SpotifyFetcher;

    constructor(data: { token: string }) {
        super({
            token: data.token,
            name: "PikaSpotify",
        });

        const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

        if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
            throw new Error("Set Spotify Credentials!!");
        }

        this.spotify = new Spotify({
            clientId: SPOTIFY_CLIENT_ID,
            clientSecret: SPOTIFY_CLIENT_SECRET,
        });
    }

    onStart(message: Message, replyMarkup: ReplyKeyboardMarkup): void {
        this.bot.sendMessage(
            message.chat.id,
            `Hi ${message.chat.first_name} To download from Spotify, send the track link, album or playlist 🟢.`,
            {
                reply_markup: {
                    ...replyMarkup,
                },
            }
        );
    }

    onLink(message: Message): void {
        const url = message.text || "";

        try {
            if (REGEX.SPOTIFY_TRACK.test(url)) {
                this.downloadTrack(url, message);
            } else if (REGEX.SPOTIFY_ALBUM.test(url)) {
                this.downloadAlbum(url, message);
            } else if (REGEX.SPOTIFY_PLAYLIST.test(url)) {
                this.downloadPlaylist(url, message);
            }
        } catch (error) {
            this.bot.sendMessage(
                message.chat.id,
                "There was a problem downloading the file, please make sure the link is correct ⚠️"
            );
            console.error("Error in Downloading: ", error);
        }
    }

    async downloadTrack(url: string, message: Message) {
        const chatId = message.chat.id;
        const trackDetails = await this.spotify.getTrack(url);

        const downloadingMessage = await this.bot.sendMessage(
            chatId,
            `⏳ Downloading track "${trackDetails?.name}" by "${trackDetails?.artists[0]} ⏳"`
        );

        const trackBuffer = await this.spotify.downloadTrack(url);

        const coverMessage = await this.bot.sendPhoto(
            chatId,
            trackDetails?.cover_url,
            {
                caption: `🎙 ${trackDetails?.name} - ${trackDetails?.artists[0]} \n\n💽 <b>Album</b> : ${trackDetails?.album_name} \n🗓 ${trackDetails?.release_date} \n\n🎯 Download by <a href="t.me/PikaSpotify_bot">PikaBin</a>`,
                parse_mode: "HTML",
            }
        );

        const fileMessage = await this.bot.sendAudio(
            chatId,
            trackBuffer,
            {
                caption: `🎙 ${trackDetails?.name} - ${trackDetails?.artists[0]} \n\n💽 <b>Album</b> : ${trackDetails?.album_name} \n🗓 ${trackDetails?.release_date} \n\n🎯 Download by <a href="t.me/PikaSpotify_bot">PikaBin</a>`,
                parse_mode: "HTML",
                title: trackDetails?.name,
                performer: trackDetails?.artists[0],
                thumbnail: trackDetails?.cover_url,
            },
            {
                filename: `${trackDetails.name}.mp3`,
            }
        );

        if (fileMessage.message_id) {
            this.bot.deleteMessage(chatId, downloadingMessage?.message_id);
            this.bot.sendMessage(
                chatId,
                "<b>Download has been finished ✅</b>",
                {
                    reply_to_message_id: coverMessage?.message_id,
                    parse_mode: "HTML",
                }
            );
        }
    }

    async downloadAlbum(url: string, message: Message) {
        const chatId = message.chat.id;

        const albumData = await this.spotify.getAlbum(url);
        const albumFormat = albumData.name.split(" - ");
        const albumName = albumFormat[0];
        const albumArtist = albumFormat[1];

        const downloadingMessage = await this.bot.sendMessage(
            chatId,
            `⏳ Downloading album "${albumName}" by "${albumArtist}"`
        );

        for (const track of albumData.tracks) {
            const trackData = await this.spotify.getTrack(track);

            const buffer = await this.spotify.downloadTrack(track);

            let coverMessage: Message | null = null;
            if (albumData.tracks.indexOf(track) === 0) {
                coverMessage = await this.bot.sendPhoto(
                    chatId,
                    trackData?.cover_url,
                    {
                        caption: `🎙 ${albumData.name} \n\n📀 ${albumData.total_tracks} Tracks\n🗓 ${trackData?.release_date} \n\n🎯 Download by <a href="t.me/PikaSpotify_bot">PikaBin</a>`,
                        parse_mode: "HTML",
                    }
                );
            }

            const fileMessage = await this.bot.sendAudio(
                chatId,
                buffer,
                {
                    caption: `🎙 ${albumData.name} \n\n📀 ${albumData.total_tracks} Tracks\n🗓 ${trackData?.release_date} \n\n🎯 Download by <a href="t.me/PikaSpotify_bot">PikaBin</a>`,
                    parse_mode: "HTML",
                    title: trackData.name,
                    performer: trackData.artists[0],
                    thumbnail: trackData?.cover_url,
                },
                {
                    filename: `${trackData.name}.mp3`,
                }
            );

            if (
                albumData.tracks.length - 1 ===
                    albumData.tracks.indexOf(track) &&
                fileMessage.message_id
            ) {
                this.bot.deleteMessage(chatId, downloadingMessage?.message_id);
                this.bot.sendMessage(
                    chatId,
                    "<b>Download has been finished ✅</b>",
                    {
                        reply_to_message_id: coverMessage?.message_id,
                        parse_mode: "HTML",
                    }
                );
            }
        }
    }

    async downloadPlaylist(url: string, message: Message) {
        const chatId = message.chat.id;
        let playlistData: void | Playlist;
        let downloadingMessage: void | Message;

        try {
            playlistData = await this.spotify.getPlaylist(url).catch((err) => {
                console.log(err);
            });

            downloadingMessage = await this.bot
                .sendMessage(
                    chatId,
                    `⏳ Downloading playlist "${playlistData?.name}"`
                )
                .catch((err) => {
                    console.log(err);
                });
        } catch (err) {
            console.log(err);
            this.bot.sendMessage(
                chatId,
                "Error finding playlist, make sure the link is correct ⚠️"
            );
            return;
        }

        // const buffer = await this.spotify.downloadPlaylist(url).catch((err) => {
        // 	console.log(err);
        // 	this.bot.sendMessage(chatId, "Error downloading playlist ⚠️").catch((err) => {
        // 		console.log(err);
        // 	});
        // });

        for (let i = 0; i < (playlistData?.total_tracks as number); i++) {
            let coverMess: Message | null = null;
            const track = playlistData?.tracks[i];
            const trackData = await this.spotify.getTrack(track as string);

            const buffer = await this.spotify
                .downloadTrackFromInfo(trackData)
                .catch((err) => {
                    console.log(err);
                    this.bot
                        .sendMessage(chatId, "Error downloading track ⚠️ ⚠️")
                        .catch((err) => {
                            console.log(err);
                        });
                });

            if (i === 0) {
                coverMess = await this.bot.sendPhoto(
                    chatId,
                    trackData?.cover_url,
                    {
                        caption: `🎙 ${playlistData?.name} \n\n📀 ${playlistData?.total_tracks} Tracks\n🗓 ${trackData?.release_date} \n\n🎯 Download by <a href="t.me/PikaSpotify_bot">PikaBin</a>`,
                        parse_mode: "HTML",
                    }
                );
            }

            let fileMess = await this.bot
                .sendAudio(
                    chatId,
                    buffer as Buffer,
                    {
                        caption: `🎙 ${playlistData?.name} \n\n📀 ${playlistData?.total_tracks} Tracks\n🗓 ${trackData?.release_date} \n\n🎯 Download by <a href="t.me/PikaSpotify_bot">PikaBin</a>`,
                        parse_mode: "HTML",
                        title: trackData.name,
                        performer: trackData.artists[0],
                        thumbnail: trackData?.cover_url,
                    },
                    {
                        filename: `${trackData.name}.mp3`,
                    }
                )
                .catch((err) => {
                    console.log(err);
                    this.bot
                        .sendMessage(chatId, "Error sending track ⚠️")
                        .catch((err) => {
                            console.log(err);
                        });
                });

            if (
                (playlistData?.tracks.length as number) - 1 === i &&
                fileMess?.message_id
            ) {
                this.bot.deleteMessage(
                    chatId,
                    downloadingMessage?.message_id as number
                );
                this.bot.sendMessage(
                    chatId,
                    "<b>Download has been finished ✅</b>",
                    {
                        reply_to_message_id: coverMess?.message_id as number,
                        parse_mode: "HTML",
                    }
                );
            }
        }
    }
}
