import { Context, Schema, h } from "koishi";
import { SourceQuerySocket } from "source-server-query";
import { secondFormat } from "./utils/timeFormat";
import { promises } from "node:dns";
import {} from "koishi-plugin-canvas";
import { Info, Player } from "./types/a2s";

export const name = "a2s";

export interface Config {
  recogniseConnect?: boolean;
}

export const Config: Schema<Config> = Schema.object({
  recogniseConnect: Schema.boolean()
    .description("自动识别connect [ip]消息")
    .default(true),
});

export const inject = {
  required: ["canvas"],
};

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger("wahaha216-a2s");
  ctx
    .command("a2s <address:string>", "通过a2s协议查询服务器信息")
    .example("a2s some.server.url")
    .action(async ({ session }, address) => {
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

      const players = await query.players(ip, port).catch((err) => {
        logger.error(err);
        if (!errMsg) errMsg = err;
      });

      if (info && players) {
        const height = 200 + 20 * players.length;
        const imgUrl = await getImage(ctx, height, 500, info, players);
        await session.send([h("quote", { id }), h("img", { src: imgUrl })]);
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
  height: number,
  width: number,
  info: Info,
  players: Player[]
) {
  const canvas = await ctx.canvas.createCanvas(width, height);
  const c = canvas.getContext("2d");

  c!.fillStyle = "rgba(0, 0, 0, 0.5)";
  // ctx!.roundRect(10, 10, 480, 210, 20);
  const x = 10;
  const y = 10;
  const r = 20;
  const w = canvas.width - 20;
  const h = canvas.height - 20;
  c!.beginPath();
  c!.moveTo(x + r, y);
  c!.arcTo(x + w, y, x + w, y + h, r);
  c!.arcTo(x + w, y + h, x, y + h, r);
  c!.arcTo(x, y + h, x, y, r);
  c!.arcTo(x, y, x + w, y, r);
  c!.closePath();
  c!.fill();

  c!.font = "24px 微软雅黑 bold";
  let text = info.name;
  c!.textAlign = "center";
  c!.fillStyle = "white";
  c!.fillText(text, width / 2, 45);

  c!.font = "16px 微软雅黑 bold";
  c!.textAlign = "left";
  text = `地图: ${info.map}`;
  c!.fillText(text, 50, 80);

  text = `人数: ${info.players} / ${info.max_players}`;
  c!.fillText(text, 300, 80);

  text = `版本: ${info.version}`;
  c!.fillText(text, 50, 110);

  text = "玩家昵称";
  c!.fillText(text, 50, 160);
  text = "分数";
  c!.fillText(text, 280, 160);
  text = "在线时长";
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
