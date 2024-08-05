import { Context, Schema, Session, h } from "koishi";
import { SourceQuerySocket } from "source-server-query";
import { secondFormat } from "./utils/timeFormat";
import { promises } from "node:dns";
import { Info, Player } from "./types/a2s";
import {} from "koishi-plugin-canvas";
import {} from "@koishijs/plugin-logger";
import {} from "@koishijs/plugin-http";

export const name = "a2s";

export interface Config {
  recogniseConnect?: boolean;
}

export const Config: Schema<Config> = Schema.object({
  recogniseConnect: Schema.boolean().default(true),
}).i18n({
  "zh-CN": require("./locales/zh-CN")._config,
  "en-US": require("./locales/en-US")._config,
});

export const inject = {
  required: ["canvas", "logger", "http"],
};

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define("en-US", require("./locales/en-US"));
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));

  const logger = ctx.logger("wahaha216-a2s");
  ctx.command("a2s").action(async ({ session }, address) => {
    const id = session.messageId;

    const sp = address.split(":");
    let ip = sp[0];
    let port: number | string = 27015;
    const ipReg =
      /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/;
    if (!ipReg.test(ip)) {
      const resolver = new promises.Resolver();
      const addresses = await resolver.resolve4(ip);
      if (addresses.length) {
        ip = addresses[0];
      }
    }
    sp[1] && (port = sp[1]);
    const query: SourceQuerySocket = new SourceQuerySocket();
    let errMsg: Error;
    const info = await query.info(ip, port).catch((err) => {
      logger.error(err);
      errMsg = err;
    });

    let players: Player[] | void;
    if (!errMsg) {
      players = await query.players(ip, port).catch((err) => {
        logger.error(err);
        errMsg = err;
      });
    }

    if (info && players) {
      const height = 200 + 20 * players.length;
      const imgUrl = await getImage(ctx, session, height, 500, info, players);
      await session.send([h.quote(id), h.image(imgUrl)]);
    } else {
      await session.send([h.quote(id), h.text("服务器无响应")]);
    }
  });

  ctx.on("message", (session) => {
    if (config.recogniseConnect) {
      const text = session.content;
      const regexp =
        /^connect (((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])|([a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?))(?::(?:[1-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/i;
      if (regexp.test(text)) {
        const cmd = text.replace(/connect/i, "a2s");
        session.execute(cmd);
      }
    }
  });
}

async function getImage(
  ctx: Context,
  session: Session,
  height: number,
  width: number,
  info: Info,
  players: Player[]
) {
  const canvas = await ctx.canvas.createCanvas(width, height);
  const c = canvas.getContext("2d");

  c!.fillStyle = "rgba(0, 0, 0, 0.5)";
  // ctx!.roundRect(10, 10, 480, 210, 20);
  const x = 0;
  const y = 0;
  const r = 20;
  const w = canvas.width;
  const h = canvas.height;
  c!.beginPath();
  c!.moveTo(x + r, y);
  c!.arcTo(x + w, y, x + w, y + h, r);
  c!.arcTo(x + w, y + h, x, y + h, r);
  c!.arcTo(x, y + h, x, y, r);
  c!.arcTo(x, y, x + w, y, r);
  c!.closePath();
  c!.fill();

  c!.font = "24px Microsoft YaHei bold";
  let text = info.name;
  c!.textAlign = "center";
  c!.fillStyle = "white";
  c!.fillText(text, width / 2, 45);

  c!.font = "14px Microsoft YaHei bold";
  text = info.game;
  c!.fillText(text, width / 2, 63);

  c!.font = "16px Microsoft YaHei bold";
  c!.textAlign = "left";

  text = `${session.text(".map")}: ${info.map}`;
  c!.fillText(text, 50, 80);

  text = `${session.text(".players")}: ${info.players} / ${info.max_players}`;
  c!.fillText(text, 300, 80);

  text = `${session.text(".version")}: ${info.version}`;
  c!.fillText(text, 50, 110);

  const environment = info.environment === "w" ? "windows" : "linux";
  text = `${session.text(".environment")}: ${environment}`;
  c!.fillText(text, 300, 110);

  text = session.text(".nickname");
  c!.fillText(text, 50, 160);
  text = session.text(".score");
  c!.fillText(text, 280, 160);
  text = session.text(".duration");
  c!.fillText(text, 350, 160);

  // 分割线
  c!.beginPath();
  c!.moveTo(50, 170);
  c!.lineTo(450, 170);
  c!.closePath();
  c!.strokeStyle = "white";
  c!.stroke();

  players.forEach((p, index) => {
    text = p.name;
    c!.fillText(text, 50, 190 + 20 * index);
    text = `${p.score}`;
    c!.fillText(text, 280, 190 + 20 * index);
    text = secondFormat(p.duration);
    c!.fillText(text, 350, 190 + 20 * index);
  });
  return canvas.toDataURL("image/png");
}
