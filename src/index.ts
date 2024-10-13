import { Context, Schema, Session, h } from "koishi";
import { SourceQuerySocket } from "source-server-query";
import { secondFormat } from "./utils/timeFormat";
import { promises } from "node:dns";
import { Info, Player, QueryServerInfo } from "./types/a2s";
import {} from "koishi-plugin-puppeteer";
import {} from "@koishijs/plugin-logger";
import {} from "@koishijs/plugin-http";
import {} from "@koishijs/plugin-database-sqlite";

export const name = "a2s";

export interface ServerInfo {
  name: string;
  ip: string;
  group: string;
}

declare module "koishi" {
  interface Tables {
    a2s_server_info: ServerInfo;
  }
}

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
  required: ["puppeteer", "logger", "http"],
  optional: ["database"],
};

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define("en-US", require("./locales/en-US"));
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));

  const platformIcon = {
    linux: `<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg width="20px" height="20px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="#202020" d="M13.338 12.033c-.1-.112-.146-.319-.197-.54-.05-.22-.107-.457-.288-.61v-.001a.756.756 0 00-.223-.134c.252-.745.153-1.487-.1-2.157-.312-.823-.855-1.54-1.27-2.03-.464-.586-.918-1.142-.91-1.963.014-1.254.138-3.579-2.068-3.582-.09 0-.183.004-.28.012-2.466.198-1.812 2.803-1.849 3.675-.045.638-.174 1.14-.613 1.764-.515.613-1.24 1.604-1.584 2.637-.162.487-.24.984-.168 1.454-.023.02-.044.041-.064.063-.151.161-.263.357-.388.489-.116.116-.282.16-.464.225-.183.066-.383.162-.504.395v.001a.702.702 0 00-.077.339c0 .108.016.217.032.322.034.22.068.427.023.567-.144.395-.163.667-.061.865.102.199.31.286.547.335.473.1 1.114.075 1.619.342l.043-.082-.043.082c.54.283 1.089.383 1.526.284a.99.99 0 00.706-.552c.342-.002.717-.146 1.318-.18.408-.032.918.145 1.503.113a.806.806 0 00.068.183l.001.001c.227.455.65.662 1.1.627.45-.036.928-.301 1.315-.762l-.07-.06.07.06c.37-.448.982-.633 1.388-.878.203-.123.368-.276.38-.499.013-.222-.118-.471-.418-.805z"/><path fill="#F8BF11" d="M13.571 12.828c-.007.137-.107.24-.29.35-.368.222-1.019.414-1.434.918-.362.43-.802.665-1.19.696-.387.03-.721-.13-.919-.526v-.002c-.123-.233-.072-.6.031-.987s.251-.785.271-1.108v-.001c.02-.415.044-.776.114-1.055.07-.28.179-.468.373-.575a.876.876 0 01.027-.014c.022.359.2.725.514.804.343.09.838-.204 1.047-.445l.122-.004c.184-.005.337.006.495.143v.001c.121.102.179.296.229.512.05.217.09.453.239.621.287.32.38.534.371.672zM6.592 13.843v.003c-.034.435-.28.672-.656.758-.377.086-.888 0-1.398-.266-.565-.3-1.237-.27-1.667-.36-.216-.045-.357-.113-.421-.238-.064-.126-.066-.345.071-.72v-.001l.001-.002c.068-.209.018-.438-.015-.653-.033-.214-.049-.41.024-.546l.001-.001c.094-.181.232-.246.403-.307.17-.062.373-.11.533-.27l.001-.001h.001c.148-.157.26-.353.39-.492.11-.117.22-.195.385-.196h.005a.61.61 0 01.093.008c.22.033.411.187.596.437l.533.971v.001c.142.296.441.622.695.954.254.333.45.666.425.921z"/><path fill="#D6A312" d="M9.25 4.788c-.043-.084-.13-.164-.28-.225-.31-.133-.444-.142-.617-.254-.28-.181-.513-.244-.706-.244a.834.834 0 00-.272.047c-.236.08-.392.25-.49.342-.02.019-.044.035-.104.08-.06.043-.15.11-.28.208-.117.086-.154.2-.114.332.04.132.167.285.4.417h.001c.145.085.244.2.358.291a.801.801 0 00.189.117c.072.031.156.052.26.058.248.015.43-.06.59-.151.16-.092.296-.204.452-.255h.001c.32-.1.548-.301.62-.493a.324.324 0 00-.008-.27z"/><path fill="#202020" d="M8.438 5.26c-.255.133-.552.294-.869.294-.316 0-.566-.146-.745-.289-.09-.07-.163-.142-.218-.193-.096-.075-.084-.181-.045-.178.066.008.076.095.117.134.056.052.126.12.211.187.17.135.397.266.68.266.284 0 .614-.166.816-.28.115-.064.26-.179.379-.266.09-.067.087-.147.162-.138.075.009.02.089-.085.18-.105.092-.27.214-.403.283z"/><path fill="#ffffff" d="M12.337 10.694a1.724 1.724 0 00-.104 0h-.01c.088-.277-.106-.48-.621-.713-.534-.235-.96-.212-1.032.265-.005.025-.009.05-.011.076a.801.801 0 00-.12.054c-.252.137-.389.386-.465.692-.076.305-.098.674-.119 1.09-.013.208-.099.49-.186.79-.875.624-2.09.894-3.122.19-.07-.11-.15-.22-.233-.328a13.85 13.85 0 00-.16-.205.65.65 0 00.268-.05.34.34 0 00.186-.192c.063-.17 0-.408-.202-.68-.201-.273-.542-.58-1.043-.888-.368-.23-.574-.51-.67-.814-.097-.305-.084-.635-.01-.96.143-.625.51-1.233.743-1.614.063-.046.023.086-.236.567-.232.44-.667 1.455-.072 2.248.016-.564.15-1.14.377-1.677.329-.747 1.018-2.041 1.072-3.073.029.02.125.086.169.11.126.075.221.184.344.283a.85.85 0 00.575.2c.24 0 .427-.079.582-.168.17-.096.304-.204.433-.245.27-.085.486-.235.608-.41.21.83.7 2.027 1.014 2.611.167.31.5.969.643 1.762.091-.002.191.01.299.038.375-.973-.319-2.022-.636-2.314-.128-.124-.135-.18-.07-.177.343.304.795.917.96 1.608.075.315.09.646.01.973.04.017.08.034.12.054.603.293.826.548.719.897z"/><path fill="#E6E6E6" d="M8.04 8.062c-.556.002-1.099.251-1.558.716-.46.464-.814 1.122-1.018 1.888l.061.038v.004c.47.298.805.598 1.012.878.219.296.316.584.223.834a.513.513 0 01-.27.283l-.041.015c.074.097.146.197.213.3.944.628 2.042.396 2.867-.172.08-.278.153-.536.163-.698.021-.415.042-.792.124-1.12.082-.33.242-.63.544-.795.017-.01.034-.015.051-.023a.756.756 0 01.022-.094c-.242-.622-.591-1.14-1.01-1.5-.42-.36-.897-.551-1.382-.554zm2.37 2.155l-.002.005v-.002l.001-.004z"/><path fill="#ffffff" d="M9.278 3.833a1.05 1.05 0 01-.215.656 4.119 4.119 0 00-.218-.09l-.127-.045c.029-.035.085-.075.107-.127a.669.669 0 00.05-.243l.001-.01a.673.673 0 00-.035-.236.434.434 0 00-.108-.184.223.223 0 00-.156-.07H8.57a.228.228 0 00-.151.06.434.434 0 00-.122.175.676.676 0 00-.05.243v.01a.718.718 0 00.009.14 1.773 1.773 0 00-.354-.12 1.196 1.196 0 01-.01-.133v-.013a1.035 1.035 0 01.088-.447.793.793 0 01.25-.328.554.554 0 01.346-.123h.006c.125 0 .232.036.342.116a.78.78 0 01.257.324c.063.138.094.273.097.433l.001.012zM7.388 3.997a1.05 1.05 0 00-.277.125.623.623 0 00.002-.15v-.008a.651.651 0 00-.048-.192.37.37 0 00-.096-.141.158.158 0 00-.119-.045c-.042.004-.077.024-.11.065a.372.372 0 00-.07.156.626.626 0 00-.013.205v.008a.634.634 0 00.048.193.367.367 0 00.116.156l-.102.08-.078.056a.706.706 0 01-.16-.24c-.053-.12-.082-.24-.09-.381v-.001a1.071 1.071 0 01.045-.39.668.668 0 01.167-.292.359.359 0 01.264-.118c.084 0 .158.028.235.09a.68.68 0 01.199.271c.053.12.08.24.089.382v.001c.003.06.003.115-.002.17z"/><path fill="#202020" d="M7.806 4.335c.01.034.065.029.097.045.027.014.05.045.08.046.03.001.076-.01.08-.04.005-.038-.052-.063-.088-.077-.047-.019-.107-.028-.151-.003-.01.005-.021.018-.018.03zM7.484 4.335c-.01.034-.065.029-.096.045-.028.014-.05.045-.081.046-.03.001-.076-.01-.08-.04-.005-.038.052-.063.088-.077.047-.019.108-.028.152-.003.01.005.02.018.017.03z"/></svg>`,
    windows: `<?xml version="1.0" encoding="iso-8859-1"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg height="20px" width="20px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><polygon style="fill:#90C300;" points="242.526,40.421 512,0 512,239.832 242.526,239.832 "/><polygon style="fill:#F8672C;" points="0,75.453 206.596,44.912 206.596,242.526 0,242.526 "/><polygon style="fill:#FFC400;" points="242.526,471.579 512,512 512,278.456 242.526,278.456 "/><polygon style="fill:#00B4F2;" points="0,436.547 206.596,467.088 206.596,278.456 0,278.456 "/></svg>`,
  };

  const getIpPortFromUrl = async (url: string) => {
    const sp = url.split(":");
    let ip = sp[0];
    let port: number | string = 27015;
    const ipReg =
      /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/;
    if (!ipReg.test(ip)) {
      const resolver = new promises.Resolver();
      const addresses = await resolver.resolve4(ip).catch(() => {});
      if (addresses && addresses.length) {
        ip = addresses[0];
      }
    }
    sp[1] && (port = sp[1]);
    return { ip, port };
  };

  const queryServerInfo: QueryServerInfo = async (ip, port) => {
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
    if (errMsg) {
      return { code: -1, info: null, players: null, errMsg };
    } else {
      return {
        code: 0,
        info: info as Info,
        players: players as Player[],
        errMsg: null,
      };
    }
  };

  // html模板
  const htmlMap = {
    info: (session: Session, info: Info, players: Player[]) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div class="gameName">${info.game}</div>
    <div class="serverName">${info.name}</div>
    <div class="serverInfo">
      <div class="left">${session.text(".map")}: ${info.map}</div>
      <div class="right">${session.text(".players")}: ${info.players}/${
      info.max_players
    }</div>
    </div>
    <div class="serverInfo">
      <div class="left">${session.text(".version")}: ${info.version}</div>
      <div class="right">
      ${session.text(".environment")}: ${
      info.environment === "l" ? platformIcon.linux : platformIcon.windows
    }
      ${info.environment === "l" ? "linux" : "windows"}
      </div>
    </div>
    <table class="table" border>
      <thead>
        <tr>
          <th class="player_name">${session.text(".nickname")}</th>
          <th class="score">${session.text(".score")}</th>
          <th class="time">${session.text(".duration")}</th>
        </tr>
      </thead>
      <tbody>
        ${players
          .map(
            (item) => `<tr>
          <td class="player_name">${item.name}</td>
          <td class="score">${item.score}</td>
          <td class="time">${secondFormat(item.duration)}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </body>
  <style>
    html {
      width: 500px;
      background-color: #000;
      color: #fff;
    }
    .gameName {
      text-align: center;
      font-weight: bold;
      font-size: 24px;
    }
    .serverName {
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 20px;
      padding: 0 10px;
    }
    .serverInfo {
      display: flex;
    }
    .serverInfo .left {
      width: 310px;
      padding-left: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .serverInfo .right {
      display: flex;
      margin-left: 20px;
      width: 150px;
    }
    .table {
      margin: 20px 10px;
      width: calc(100% - 20px);
      text-align: left;
      border-collapse: collapse;
      border: none;
    }
    .table .player_name {
      border: none;
    }
    .table .score {
      border: none;
      width: 60px;
    }
    .table .time {
      border: none;
      width: 80px;
    }
    .table thead .player_name,
    .table thead .score,
    .table thead .time {
      border-bottom: 2px solid white;
      padding-bottom: 5px;
    }
  </style>
</html>
`,
    allServer: (session: Session, allServer: ServerInfo[]) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>数据库中的服务器列表</title>
  </head>
  <body>
    <table class="table" border>
      <thead>
        <tr>
          <th class="index">${session.text(".index")}</th>
          <th class="name">${session.text(".name")}</th>
          <th class="ip">${session.text(".ip")}</th>
        </tr>
      </thead>
      <tbody>
        ${allServer
          .map(
            (server, index) => `<tr>
          <td class="index">${index + 1}</td>
          <td class="name">
            <div class="name-no-warp">${server.name}</div>
          </td>
          <td class="ip">
            <div class="ip-no-warp">${server.ip}</div>
          </td>
        </tr>`
          )
          .join("\n")}
      </tbody>
    </table>
  </body>
  <style>
    html {
      width: 500px;
      color: #fff;
      border-radius: 20px;
    }
    body {
      margin: 0;
      background-color: #000;
    }
    .table {
      margin: 20px 10px;
      width: calc(100% - 20px);
      text-align: left;
      border-collapse: collapse;
      border: none;
    }
    .table .index {
      border: none;
      width: 50px;
    }
    .table .name {
      border: none;
      width: 100px;
    }
    .table .name .name-no-warp {
      width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .table .ip {
      border: none;
      width: 330px;
    }
    .table .ip .ip-no-warp {
      width: 330px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .table thead .index,
    .table thead .name,
    .table thead .ip {
      border-bottom: 2px solid white;
      padding-bottom: 5px;
    }
  </style>
</html>
`,
    list: async (session: Session, allServer: ServerInfo[]) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>服务器列表</title>
  </head>
  <body>
    <table class="table" border>
      <thead>
        <tr>
          <th class="index">${session.text(".index")}</th>
          <th class="game">${session.text(".game")}</th>
          <th class="name">${session.text(".name")}</th>
          <th class="environment">${session.text(".environment")}</th>
          <th class="players">${session.text(".players")}</th>
        </tr>
      </thead>
      <tbody>
        ${(
          await Promise.all(
            allServer.map(async (server, index) => {
              const { ip, port } = await getIpPortFromUrl(server.ip);
              const { code, info } = await queryServerInfo(ip, port);
              let environment = "N/A";
              if (code === 0) {
                if (info.environment === "l") {
                  environment = platformIcon.linux;
                } else {
                  environment = platformIcon.windows;
                }
              }

              const player =
                code === 0 ? `${info.players}/${info.max_players}` : "N/A";
              return `<tr>
          <td class="index">${index + 1}</td>
          <td class="game">
            <div class="game-no-warp">${code === 0 ? info.game : "N/A"}</div>
          </td>
          <td class="name">
            <div class="name-no-warp">
              ${code === 0 ? info.name : "N/A"}
            </div>
          </td>
          <td class="environment">
            <div class="environment-align">${environment}</div>
          </td>
          <td class="players">${code === 0 ? player : "N/A"}</td>
        </tr>`;
            })
          )
        ).join("\n")}
      </tbody>
    </table>
  </body>
  <style>
    html {
      width: 800px;
      color: #fff;
      border-radius: 20px;
    }
    body {
      margin: 0;
      background-color: #000;
    }
    .table {
      margin: 20px 10px;
      width: calc(100% - 20px);
      text-align: left;
      border-collapse: collapse;
      border: none;
    }
    .table .index {
      border: none;
      width: 40px;
    }
    .table .game {
      border: none;
      width: 200px;
    }
    .table .game .game-no-warp {
      width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .table .name {
      border: none;
    }
    .table .name .name-no-warp {
      width: 360px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .table .environment {
      border: none;
      width: 80px;
    }
    .table .environment .environment-align {
      display: flex;
    }
    .table .players {
      border: none;
      width: 80px;
    }
    .table thead .index,
    .table thead .game,
    .table thead .name,
    .table thead .environment,
    .table thead .players {
      border-bottom: 2px solid white;
      padding-bottom: 5px;
    }
  </style>
</html>
`,
  };

  const getImageFromHtml = async (
    html: string,
    width: number,
    height: number
  ) => {
    const context = await ctx.puppeteer.browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "load" });
    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    });
    await page.close();
    await context.close();
    return imageBuffer;
  };

  const handleSingleServer = async (
    session: Session,
    address: string,
    withConnect?: boolean
  ) => {
    const id = session.messageId;

    const { ip, port } = await getIpPortFromUrl(address);
    const { code, info, players } = await queryServerInfo(ip, port);

    if (code === 0) {
      const height = 200 + 20 * players.length;
      const html = htmlMap.info(session, info, players);
      const imageBuffer = await getImageFromHtml(html, 500, height);
      const f = [h.quote(id), h.image(imageBuffer, "image/png")];
      if (withConnect) f.push(h.text(`connect ${address}`));
      await session.send(f);
    } else {
      await session.send([h.quote(id), h.text(session.text(".noRespone"))]);
    }
  };

  const logger = ctx.logger("wahaha216-a2s");
  ctx.command("a2s <address:string>").action(async ({ session }, address) => {
    await handleSingleServer(session, address);
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

  // 保存服务器信息以供快捷查询
  if (ctx.database) {
    ctx.model.extend(
      "a2s_server_info",
      { name: "string", ip: "string", group: "string" },
      { primary: "name" }
    );

    // 添加服务器
    ctx
      .command("a2s_server.add <arg1> <arg2>")
      .alias("添加服务器")
      .option("group", "-g <group:string>")
      .action(async ({ session, options }, name, ip) => {
        const id = session.messageId;
        const isNameExist = await ctx.database.get("a2s_server_info", { name });
        if (isNameExist.length) {
          await session.send([
            h.quote(id),
            h.text(session.text(".serverExist", [name])),
          ]);
        } else {
          await ctx.database.create("a2s_server_info", {
            name,
            ip,
            group: options.group,
          });

          session.send([
            h.quote(id),
            h.text(session.text(".serverAdded", [name])),
          ]);
        }
      });

    // 修改服务器
    ctx
      .command("a2s_server.edit <arg1> <arg2>")
      .alias("修改服务器", "修改服务器信息")
      .option("group", "-g <group:string>")
      .action(async ({ session, options }, name, ip) => {
        const id = session.messageId;
        const isNameExist = await ctx.database.get("a2s_server_info", { name });
        if (isNameExist.length) {
          await ctx.database.set(
            "a2s_server_info",
            { name },
            { ip, group: options.group }
          );
          await session.send([
            h.quote(id),
            h.text(session.text(".serverEdited", [name])),
          ]);
        } else {
          await session.send([
            h.quote(id),
            h.text(session.text(".serverNotExist", [name])),
          ]);
        }
      });

    // 删除服务器
    ctx
      .command("a2s_server.del <name:string>")
      .alias("删除服务器")
      .action(async ({ session }, name) => {
        const id = session.messageId;
        const isNameExist = await ctx.database.get("a2s_server_info", { name });
        if (isNameExist.length) {
          await ctx.database.remove("a2s_server_info", { name });
          await session.send([
            h.quote(id),
            h.text(session.text(".serverDeleted", [name])),
          ]);
        } else {
          await session.send([
            h.quote(id),
            h.text(session.text(".serverNotExist", [name])),
          ]);
        }
      });

    // 获取所有服务器
    ctx
      .command("a2s_server.list")
      .alias("服务器列表")
      .action(async ({ session }) => {
        const id = session.messageId;
        const allServer = await ctx.database
          .select("a2s_server_info")
          .execute();
        const height = 40 + 20 * allServer.length;
        const html = htmlMap.allServer(session, allServer);
        const imageBuffer = await getImageFromHtml(html, 500, height);
        await session.send([h.quote(id), h.image(imageBuffer, "image/png")]);
      });

    // 服务器列表
    ctx
      .command("a2s_server")
      .alias("所有服务器", "全部服务器")
      .action(async ({ session }) => {
        const id = session.messageId;
        const allServer = await ctx.database
          .select("a2s_server_info")
          .execute();
        const height = 40 + 20 * allServer.length;
        const html = await htmlMap.list(session, allServer);
        const imageBuffer = await getImageFromHtml(html, 800, height);
        await session.send([h.quote(id), h.image(imageBuffer, "image/png")]);
      });

    // 服务器详情
    ctx
      .command("a2s_server.info <name:string>")
      .alias("服务器详情")
      .action(async ({ session }, name) => {
        const id = session.messageId;

        const handleServer = async () => {
          const server = await ctx.database.get("a2s_server_info", { name });
          if (server.length) {
            await handleSingleServer(session, server[0].ip, true);
          } else {
            await session.send([
              h.quote(id),
              h.text(session.text(".cantFindServer", [name])),
            ]);
          }
        };

        if (/^\d+$/.test(name)) {
          const allServer = await ctx.database
            .select("a2s_server_info")
            .execute();
          const index = parseInt(name) - 1;
          if (index > allServer.length || index < 0) {
            await handleServer();
          } else {
            const server = allServer[index];
            await handleSingleServer(session, server.ip, true);
          }
        } else {
          await handleServer();
        }
      });
  }
}
