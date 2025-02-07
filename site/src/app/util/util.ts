import { createDataItemSigner, dryrun, message, monitor, spawn, unmonitor } from "@permaweb/aoconnect/browser";
import { AO_TWITTER, ARWEAVE_GATEWAY, MODULE, AOS_V2_MODULE, SCHEDULER, regexPatterns, MU } from "./consts";
import { Server } from "../../server/server";
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import * as Othent from "@othent/kms";
import { ArweaveSigner } from "arseeding-arbundles/src/signing";
import { createData } from "arseeding-arbundles";
// import { Web3Provider } from 'arseeding-arbundles/node_modules/@ethersproject/providers'
import { InjectedEthereumSigner } from 'arseeding-arbundles/src/signing';
import { JWKInterface } from "arseeding-arbundles/src/interface-jwk";
import { CreateWalletReturnProps } from "arweavekit/dist/types/wallet";
import { createWallet } from "arweavekit/wallet";

declare var window: any;

/**
 * check the input if is a valid number
 * @param value 
 * @returns 
 */
export function checkNumber(value: string) {
  const regex = /^[0-9]*$/; // 0-9 number

  if (regex.test(value)) {
    return true;
  } else {
    return false;
  }
};

export function isDifferentYear(timestamp1: number, timestamp2: number) {
  return new Date(timestamp1).getFullYear() !== new Date(timestamp2).getFullYear();
}

/**
 * Format time to twitter style ones
 * @param time timestamp in seconds
 * @param ago the 'ago' suffix 
 * @returns the time formatted
 */
export function formatTimestamp(time: number, ago?: boolean) {

  const m = new Map([[1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'], [6, 'Jun'],
  [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'], [11, 'Nov'], [12, 'Dec']]);

  let now = secondsOfNow();
  let diff = now - time;

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = Math.floor(diff % 60);

  if (days > 0) {
    const date = new Date(time * 1000);
    if (isDifferentYear(time * 1000, Date.now())) {
      return date.toLocaleDateString();
    }
    else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return m.get(month) + ' ' + day;
    }
  }

  if (hours > 0) {
    let t = hours + 'h';
    if (ago) t += ' ago';
    return t;
  }

  if (minutes > 0) {
    let t = minutes + 'm';
    if (ago) t += ' ago';
    return t;
  }

  if (seconds > 0) {
    let t = seconds + 's';
    if (ago) t += ' ago';
    return t;
  }

  return 'just now';
};

/**
 * Gets the time value of now in milliseconds.
 * @returns the time value in milliseconds
 */
export function msOfNow() {
  return Date.now();
}

/**
 * Gets the time value of now in seconds.
 * @returns the time value in seconds
 */
export function secondsOfNow() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Gets the unique id.
 * @returns the unique id
 */
export function uniqueId() {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Generate a random number between min and max, including both min and max.
 * @param min 
 * @param max 
 * @returns the integer
 */
export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getMenuIcon(name: string): string {
  return './' + name + '.png';
}

/**
 * Convert the url in the str to link
 * @param str
 * @returns 
 */
export function urlToLink(str: string): any {
  const re = /(f|ht){1}(tp|tps):\/\/([\w-]+\S)+[\w-]+([\w-?%#&=]*)?(\/[\w- ./?%#&=]*)?/g;

  str = str.replace(re, function (url) {
    return `<a href=${url} target="_blank" style="color: white">${url}</a>`;
  });

  return { __html: str };
}

export function numberWithCommas(x: number): string {
  if (x < 1) return x.toString();
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * get amount of media file from the Quill editor content
 * @param quillRef 
 * @returns 
 */
export function getMediaAmount(quillRef: any) {
  let mediaAmount = 0;
  let html = quillRef.root.innerHTML;
  let img = html.match(/<img/gi);
  let iframe = html.match(/<iframe/gi);
  let audio = html.match(/<audio/gi);
  mediaAmount += img && img.length;
  mediaAmount += iframe && iframe.length;
  mediaAmount += audio && audio.length;

  return mediaAmount;
}

/**
 * Convert the substr which start with @ to user slug
 * @param str
 * @returns 
 */
export function convertSlug(str: string): any {
  const pattern = /@\w+(-\w+)*/g;
  str = str.replace(pattern, function (slug) {
    return `<a className='activity-page-slug-link' href='/profile/${slug.substring(1)}' id="url-${slug}">${slug}</a>`;
  });

  return str;
}

/**
 * Convert the substr which start with # to hash tag
 * @param str
 * @returns 
 */
export function convertHashTag(str: string): any {
  const pattern = /#\w+(-\w+)*/g;
  str = str.replace(pattern, function (hashtag) {
    return `<a className='activity-page-slug-link' href='/plan/${hashtag.substring(1)}' id="url-${hashtag}">${hashtag}</a>`;
  });

  return str;
}

/**
 * Convert the URLs that are not within a tag to link.
 * @param text original string
 * @returns 
 */
export function convertUrlsToLinks(text: string) {
  const { urlRegex, imageRegex, hrefRegex, youtubeRegex } = regexPatterns;

  // match all of <a> tag content
  const hrefs = text.match(hrefRegex);

  // repalce all of URLs while ignoring URLs that are already within an <a>, <img> or <audio> tag.
  const convertedText = text.replace(urlRegex, (url) => {
    if (hrefs && hrefs.includes(`<a href="${url}"`))
      return url;
    else if (youtubeRegex.test(url))
      return `<span class="youtube-url" data-src="${url}"></span>`;
    else if (imageRegex.test(url))
      return `<img src="${url}" alt="${url}" class="ql-editor-image"/>`;
    else
      return `<a href=${url} target="_blank" id="url-${url}">${url}</a>`;
  });

  return convertedText;

  // return text.replace(urlRegex, function(url) {
  //   const href = url.startsWith('http') ? url : `http://${url}`;
  //   return `<a href="${href}" target="_blank">${url}</a>`;
  // });
}

export function convertUrlsOLD(str: string): string {
  // match all of URLs
  const urlRegex = /(f|ht){1}(tp|tps):\/\/([\w-]+\S)+[\w-]+([\w-?%#&=]*)?(\/[\w- ./?%#&=]*)?/g;

  // match all of <a> tag content
  const hrefRegex = /<a\s+[^>]*?href\s*=\s*(['"])(.*?)\1/g;
  const hrefs = str.match(hrefRegex);

  // match all of img tag content
  const imgSrcRegex = /<img.*?src="(.*?)".*?>/g;
  const imgSrcs = str.match(imgSrcRegex);

  // match all of audio tag content
  const audioSrcRegex = /<audio.*?src="(.*?)"/g;
  const audioSrcs = str.match(audioSrcRegex);

  // match all of iframe tag content
  const iframeSrcRegex = /<iframe.*?src="(.*?)"/g;
  const iframeSrcs = str.match(iframeSrcRegex);

  // repalce all of URLs while ignoring URLs that are already within an <a>, <img> or <audio> tag.
  const convertedText = str.replace(urlRegex, (url) => {
    if (hrefs && hrefs.includes(`<a href="${url}"`))
      return url;
    else if (imgSrcs && imgSrcs.includes(`<img src="${url}">`))
      return url;
    else if (audioSrcs && audioSrcs.includes(`<audio src="${url}"`))
      return url;
    else if (iframeSrcs && iframeSrcs.includes(`<iframe class="ql-video" frameborder="0" allowfullscreen="true" src="${url}"`))
      return url;
    else
      return `<a href=${url} target="_blank" id="url-${url}">${url}</a>`;
  });

  return convertedText;
}

export function isValidUrl(url: string) {
  var pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return pattern.test(url);
}

/**
 * Find the first text line in the string
 * @param str 
 * @returns the first text line
 */
export function getFirstLine(str: any) {
  let text = '';
  let start = str.indexOf('<p>');

  if (start != -1) {
    let end = str.indexOf('</p>', start);
    if (end != -1)
      text = str.substring(start + 3, end);

    let img = text.indexOf('<img');
    if (img != -1)
      text = text.substring(start, img);
  }

  text = text.replaceAll('&nbsp;', ' ');
  return shortStr(text, 100);
}

/**
 * Find the first image in the string
 * @param str 
 * @returns the image in base64
 */
export function getFirstImage(str: any) {
  let image = '';
  let start = str.indexOf('<img');

  if (start != -1) {
    let end = str.indexOf('>', start);
    if (end != -1)
      image = str.substring(start + 10, end - 1);
  }

  return image;
}

/**
 * browserDetect
 * @returns browserName
 */
export function browserDetect() {
  let userAgent = navigator.userAgent;
  let browserName;

  // Approach 1
  // if (userAgent.match(/chrome|chromium|crios/i)) {
  //   browserName = "chrome";
  // } else if (userAgent.match(/firefox|fxios/i)) {
  //   browserName = "firefox";
  // } else if (userAgent.match(/safari/i)) {
  //   browserName = "safari";
  // } else if (userAgent.match(/opr\//i)) {
  //   browserName = "opera";
  // } else if (userAgent.match(/edg/i)) {
  //   browserName = "edge";
  // } else {
  //   browserName="other browser";
  // }

  // Approach 2
  // CHROME
  if (userAgent.indexOf("Chrome") != -1) {
    console.log("Google Chrome");
    browserName = "chrome";
  }
  // FIREFOX
  else if (userAgent.indexOf("Firefox") != -1) {
    console.log("Mozilla Firefox");
    browserName = "firefox";
  }
  // INTERNET EXPLORER
  else if (userAgent.indexOf("MSIE") != -1) {
    console.log("Internet Exploder");
    browserName = "ie";
  }
  // EDGE
  else if (userAgent.indexOf("Edge") != -1) {
    console.log("Internet Edge");
    browserName = "edge";
  }
  // SAFARI
  else if (userAgent.indexOf("Safari") != -1) {
    console.log("Safari");
    browserName = "safari";
  }
  // OPERA
  else if (userAgent.indexOf("Opera") != -1) {
    console.log("Opera");
    browserName = "opera";
  }
  // YANDEX BROWSER
  else if (userAgent.indexOf("YaBrowser") != -1) {
    console.log("YaBrowser");
    browserName = "yandex";
  }
  // Brave - TODO: need to test and update
  else if (userAgent.indexOf("Brave") != -1) {
    console.log("Brave");
    browserName = "brave";
  }
  // OTHERS
  else {
    console.log("Others");
    browserName = "others";
  }

  return browserName;
}

export function getTimestamp(exDays: number, hour: number) {
  let now = new Date(); // Date object for now
  let year = now.getFullYear(); // Get the current year
  let month = now.getMonth(); // Get the current month (note: the month starts from 0, and 0 means January)
  let day = now.getDate(); // get current date
  let result = new Date(year, month, day + exDays, hour, 0, 0); // Create a Date object at the hour of the specified day

  return result.getTime(); // Returns the timestamp (in milliseconds) at the hour of the specified day
}

export function checkContent(quillRef: any, wordCount: number) {
  let message = '';
  let mediaAmount = getMediaAmount(quillRef);
  if (mediaAmount > 5)
    return 'Contains up to 5 media file.';

  if (wordCount == 0 && mediaAmount == 0)
    message = 'Content is empty.';
  else if (wordCount > 100000)
    message = 'Content can be up to 100000 characters long.';

  return message;
}

export function capitalizeFirstLetter(str: string) {
  return str.replace(/^\w/, c => c.toUpperCase());
}

/**
 * Gets a uuid.
 * @returns the unique uuid
 */
export function uuid() {
  var str = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return str.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the timestamp of now in seconds
 * @returns Timestamp of now in seconds
 */
export function timeOfNow() {
  let now = Math.floor(Date.now() / 1000);
  return now;
}

export async function messageToAO(process: string, data: any, action: string) {
  const signer = await getSigner();

  try {
    const messageId = await message({
      process: process,
      signer: signer,
      tags: [{ name: 'Action', value: action }],
      data: JSON.stringify(data)
    });

    // console.log("messageId:", messageId)
    return messageId;
  } catch (error) {
    console.log("messageToAO -> error:", error)
    return '';
  }
}

export async function getDataFromAO(
  process: string,
  action: string,
  data?: any
) {

  let start = performance.now();
  // console.log('==> [getDataFromAO]');

  try {
    let result = await dryrun({
      process,
      data: JSON.stringify(data),
      tags: [{ name: 'Action', value: action }]
    });
    // console.log('action', action);
    // console.log('result', result);
    let resp = result.Messages[0].Data;
    let end = performance.now();
    // console.log(`<== [getDataFromAO] [${Math.round(end - start)} ms]`);
    return JSON.parse(resp);
  } catch (error) {
    console.log('getDataFromAO --> ERR:', error)
    return '';
  }
}

// check the state of bookmark
export function isBookmarked(bookmarks: any, id: string) {
  for (let i = 0; i < bookmarks.length; i++) {
    if (id == bookmarks[i].id) return true
  }

  return false;
}

export async function connectArConnectWallet() {
  try {
    // connect to the ArConnect browser extension
    await window.arweaveWallet.connect(
      // request permissions
      ["ACCESS_ADDRESS", "ACCESS_ALL_ADDRESSES", "SIGN_TRANSACTION"],
    );
  } catch (error) {
    alert('You should connect to ArConnect browser extension.');
    return false;
  }

  return true;
}

export async function getWalletAddress() {
  let address;
  try {
    address = await window.arweaveWallet.getActiveAddress();
  } catch (error) {
    return localStorage.getItem('owner');
  }

  return address;
}

export async function isLoggedIn() {
  if (localStorage.getItem('id_token'))
    window.arweaveWallet = Othent;

  let address = await getWalletAddress();
  if (address)
    return address;
  else
    return '';
}

export async function fetchGraphQL(queryObject: any) {
  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify(queryObject),
  });

  const data = await response.json();
  // console.log("==> data:", data)
  return data.data.transactions.edges;
}

export async function getDefaultProcess(owner: string) {
  let start = performance.now();
  // console.log('==> [getDefaultProcess]');

  const queryObject = {
    query:
      `{
        transactions (
          first: 1
          owners: "${owner}"
          tags: [
            { name: "Data-Protocol", values: ["ao"] },
            { name: "Type", values: ["Process"] },
            { name: "Name", values: ["personal-life-app"]}
          ]
        ) {
          edges {
            node {
              id
            }
          }
        }
      }`
  };

  try {
    let response = await fetchGraphQL(queryObject);

    let end = performance.now();
    // console.log(`<== [getDefaultProcess] [${Math.round(end - start)} ms]`);

    if (response.length == 0)
      return '';
    else
      return response[0].node.id;
  } catch (error) {
    console.log("getDefaultProcess -> ERR:", error);
    return '';
  }
}

export async function downloadFromArweave(txid: string) {
  let url = ARWEAVE_GATEWAY + txid;
  let resp = await fetch(url);
  let data = await resp.json();
  return data;
}

// export function storePostInLocal(post: any) {
//   let list = [];
//   let val = localStorage.getItem('your_posts');
//   if (val) list = JSON.parse(val);
//   list.unshift(post);

//   localStorage.setItem('your_posts', JSON.stringify(list))
// }

export async function getTokenBalance(process: string, address: string) {
  try {
    const result = await dryrun({
      process: process,
      tags: [
        { name: 'Action', value: 'Balance' },
        { name: 'Target', value: address },
      ],
    });
    // console.log("result:", process, result)
    return result.Messages[0]?.Data;
  } catch (error) {
    console.log("getTokenBalance -> Error: ", error)
    return '';
  }
}

export async function getTokenInfo(process: string) {
  try {
    const result = await dryrun({
      process: process,
      tags: [
        { name: 'Action', value: 'Info' },
      ],
    });
    // console.log("getTokenInfo:", process, result)
    return result.Messages[0].Tags;
  } catch (error) {
    console.log("getTokenInfo -> Error: ", error)
    return '';
  }
}

export async function getTokenDenomination(process: string) {
  let info = await getTokenInfo(process);
  console.log("token info:", info)
  if (!info) return 1;

  for (let i = 0; i < info.length; i++) {
    if (info[i].name == 'Denomination') {
      return Number(info[i].value);
    }
  }

  return 1;
}

export function formatBalance(str: string, len: number) {
  let length = str.length;
  if (length > len)
    str = str.slice(0, length - len) + '.' + str.slice(length - len);
  else
    str = '0.' + str;

  return Number.parseFloat(str);
  // return str;
}

export async function transferToken(from: string, to: string, qty: string, target?: string) {
  const signer = await getSigner();

  const messageId = await message({
    process: from,
    // signer: createDataItemSigner(window.arweaveWallet),
    signer: signer,
    tags: [
      { name: 'Target', value: target ? target : '' },
      { name: 'Action', value: 'TransferToken' },
      { name: 'Recipient', value: to },
      { name: 'Quantity', value: qty },
    ],
  });

  // console.log("transfer message id:", messageId)
  return messageId;
}

export function randomAvatar() {
  const resp = createAvatar(micah, {
    seed: uuid(),
  });
  return resp.toDataUriSync();
}

export async function getProfile(address: string) {
  return await getDataFromAO(AO_TWITTER, 'GetProfile', { address });
}

export function shortStr(str: string, max: number) {
  if (str.length > max) {
    return str.substring(0, max) + '...';
  }
  return str;
}

export function shortAddr(str: string, num: number) {
  return str.substring(0, num) + '...' + str.substring(str.length - num);
}

export function trimDecimal(num: number, digits: number) {
  const numStr = num.toString();
  const dotIndex = numStr.indexOf('.');
  if (dotIndex === -1) {
    return numStr;
  }

  const intPart = numStr.slice(0, dotIndex);
  let fractPart = numStr.slice(dotIndex + 1);

  if (fractPart.length > digits) {
    fractPart = fractPart.slice(0, digits);
  } else {
    fractPart = fractPart.padEnd(digits, '0');
  }

  return `${intPart}.${fractPart}`;
}

export async function isLoggedInWithArConnect() {
  let address;
  try {
    address = await window.arweaveWallet.getActiveAddress();
  } catch (error) {
    console.log("isLoggedInWithArConnect -> ERR:", error);
    return '';
  }

  return address;
}

export async function getSigner() {
  let wallet = await isLoggedInWithArConnect();

  // Logged In With ArConnect
  if (wallet) {
    return createDataItemSigner(window.arweaveWallet);
  }

  // Logged In With Metamask
  //------------------------

  // create an arweave wallet
  wallet = await createArweaveWallet();

  // create an arweave signer
  console.log("created wallet:", wallet)
  const signer = arweaveSigner(wallet.key) as any;
  return signer;
}

export async function createArweaveWallet() {
  let wallet: CreateWalletReturnProps;
  const isWalletExist = localStorage.getItem('wallet');

  if (isWalletExist) {
    wallet = JSON.parse(isWalletExist);
  } else {
    wallet = await createWallet({
      seedPhrase: true,
      environment: 'mainnet',
    });

    localStorage.setItem('wallet', JSON.stringify(wallet));
  }

  return wallet;
}

// create a custom ethereum signer
// export const ethereumSigner = () => async ({
//   data,
//   tags = [],
//   target,
//   anchor
// }: {
//   data: any;
//   tags?: { name: string; value: string }[];
//   target?: string;
//   anchor?: string;
// }): Promise<{ id: string; raw: ArrayBuffer }> => {

//   const provider = new Web3Provider((window as any).ethereum)
//   const signer = new InjectedEthereumSigner(provider);
//   await signer.setPublicKey()
//   const dataItem = createData(data, signer, { tags, target, anchor })

//   await dataItem.sign(signer)

//   return {
//     id: dataItem.id,
//     raw: dataItem.getRaw()
//   }
// }

// create a custom arweave signer
export const arweaveSigner = (jwk: JWKInterface) => async ({
  data,
  tags = [],
  target,
  anchor
}: {
  data: any;
  tags?: { name: string; value: string }[];
  target?: string;
  anchor?: string;
}): Promise<{ id: string; raw: Buffer }> => {

  const signer = new ArweaveSigner(jwk);
  const dataItem = createData(data, signer, { tags, target, anchor });
  await dataItem.sign(signer);

  return {
    id: dataItem.id,
    raw: dataItem.getRaw()
  }
}

/**
 * 
 * @param days 
 * @param hours 
 * @param minutes 
 * @returns 返回截止时间的时间戳（以秒为单位）
 */
export function calculateDeadlineTimestamp(days: number, hours: number, minutes: number) {
  // 将输入的天、小时、分钟转换成总的毫秒数
  const totalMilliseconds =
    (days * 24 * 60 * 60 * 1000) +   // 天转为毫秒
    (hours * 60 * 60 * 1000) +      // 小时转为毫秒
    (minutes * 60 * 1000);          // 分钟转为毫秒

  // 计算截止时间
  const deadline = new Date(Date.now() + totalMilliseconds);

  return Math.floor(deadline.getTime() / 1000);
}

/**
 * 
 * @param timestampInSeconds 
 * @returns 
 */
export function timeLeftUntil(timestampInSeconds: number) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  let timeLeft = timestampInSeconds - nowInSeconds;
  // 如果时间已经过去
  if (timeLeft <= 0) {
    return "Final results";
  }

  // 计算剩余的天、小时、分钟
  const days = Math.floor(timeLeft / (24 * 60 * 60));
  const hours = Math.floor(timeLeft / (60 * 60));
  const minutes = Math.floor(timeLeft / 60);

  // 根据剩余时间显示不同的单位
  if (days > 0) {
    return `${days} days left`;
  } else if (hours > 0) {
    return `${hours} hours left`;
  } else {
    return `${minutes} minutes left`;
  }
}

export async function spawnProcess() {
  const signer = await getSigner();

  try {
    const processId = await spawn({
      module: AOS_V2_MODULE,
      scheduler: SCHEDULER,
      signer: signer,
      tags: [
        { name: "Authority", value: MU },
        { name: 'Name', value: 'personal-life-app' }
      ]
    });

    return processId;
  } catch (error) {
    console.log("spawnProcess --> error:", error)
    return '';
  }
}

export async function spawnCronProcess(cronInterval: string) {
  const signer = await getSigner();

  while (1) {
    try {
      const processId = await spawn({
        module: AOS_V2_MODULE,
        scheduler: SCHEDULER,
        signer: signer,
        tags: [
          { name: "Authority", value: MU },
          { name: "Cron-Interval", value: cronInterval },
          { name: "Cron-Tag-Action", value: "Cron" }
        ]
      });

      return processId;
    } catch (error) {
      console.log("spawnCronProcess --> error:", error)
      console.log('Try spawning again...');
      await wait(1000);  // try again after 1 seconds
    }
  }
}

// export async function spawnCronProcess(cronInterval: string) {
//   const signer = await getSigner();

//   try {
//     const processId = await spawn({
//       module: AOS_V2_MODULE,
//       scheduler: SCHEDULER,
//       signer: signer,
//       tags: [
//         { name: "Authority", value: MU },
//         { name: "Cron-Interval", value: cronInterval },
//         { name: "Cron-Tag-Action", value: "Cron" }
//       ]
//     });

//     return processId;
//   } catch (error) {
//     console.log("spawnCronProcess --> error:", error)
//     return '';
//   }
// }

/**
 * Load the lua code into a process
 * @param process 
 * @param data 
 * @returns 
 */
export async function uploadCodeToProcess(process: string, data: string) {
  const signer = await getSigner();

  while (1) {
    try {
      const messageId = await message({
        process,
        signer: signer,
        tags: [{ name: 'Action', value: 'Eval' }],
        data
      });
      console.log('--> uploadCodeToProcess Success!');
      return messageId;
    } catch (error) {
      console.log("uploadCodeToProcess --> error:", error);
      console.log('Try uploading again...');
      await wait(1000);  // try again after 1 seconds
    }
  }
}
// export async function uploadCodeToProcess(process: string, data: string) {
//   const signer = await getSigner();

//   try {
//     const messageId = await message({
//       process,
//       signer: signer,
//       tags: [{ name: 'Action', value: 'Eval' }],
//       data
//     });

//     return messageId;
//   } catch (error) {
//     console.log("uploadCodeToProcess --> error:", error)
//     return '';
//   }
// }

export async function monitorCronProcess(process: string) {
  const signer = await getSigner();

  try {
    const result = await monitor({
      process,
      signer: signer
    });
    console.log("monitorCronProcess --> result -->", result)
    return result;
  } catch (error) {
    console.log("monitorCronProcess --> error:", error)
    return '';
  }
}

export async function unmonitorCronProcess(process: string) {
  const signer = await getSigner();

  try {
    const result = await unmonitor({
      process,
      signer: signer
    });
    // console.log("unmonitorCronProcess --> result -->", result)
    return result;
  } catch (error) {
    console.log("unmonitorCronProcess --> error:", error)
    return '';
  }
}

export async function createTokenAwardProcess(data: any) {
  let process = await spawnCronProcess("10-seconds");

  // check the process if already on-chain (exist on Arweave)
  let check = true;
  while (check) {
    await wait(1000);  // to check after 1 seconds
    const isOnChain = await isProcessOnChain(process);
    console.log("process isOnChain --> ", Boolean(isOnChain))

    if (isOnChain) {
      check = false;
    } else {
      console.log('Check onchain again...');
    }
  }

  let code = tokenAwardLuaCode(data);
  await uploadCodeToProcess(process, code);
  return process;
}

export async function isProcessOnChain(id: string) {
  const start = performance.now();
  // console.log('==> [isProcessOnChain]');

  const queryObject = {
    query:
      `{
        transactions (
          ids: "${id}"
        ) {
          edges {
            node {
              id
              owner {
                address
              }
              tags {
                name
                value
              }
            }
          }
        }
      }`
  };

  try {
    const response = await fetchGraphQL(queryObject);
    // console.log("response:", response)

    const end = performance.now();
    // console.log(`<== [isProcessOnChain] [${Math.round(end - start)} ms]`);

    if (response.length == 0)
      return '';
    else
      return response[0].node.id;
  } catch (error) {
    console.log("isProcessOnChain -> ERR:", error);
    return '';
  }
}

export function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function transferTokenAward(token_process: string, to: string, qty: string) {
  const signer = await getSigner();

  try {
    const messageId = await message({
      process: token_process,
      signer: signer,
      tags: [
        { name: 'Action', value: 'Transfer' },
        { name: 'Recipient', value: to },
        { name: 'Quantity', value: qty },
      ],
    });

    // console.log("transferTokenAward message id:", messageId)
    return messageId;
  } catch (error) {
    console.log("transferTokenAward -> error:", error)
    return '';
  }
}

export function tokenAwardLuaCode(data: any) {
  const CODE =
    `
    local json          = require("json")
    local STORY_PROCESS = '${data.story_process}'
    local TOKEN_PROCESS = '${data.token_process}'
    local token_amount  = ${data.token_amount}
    local expires_at    = ${data.expires_at}
    local data          = { story_id = '${data.story_id}' }

    local function transferAward()
      print("os time: " .. os.time())
      if os.time() > expires_at then
        Send({ Target = ao.id, Action = "TransferAward" })
      end
    end

    Handlers.add(
      "CronTick",
      Handlers.utils.hasMatchingTag("Action", "Cron"),
      function(msg)
        local status, err = pcall(transferAward)
        if not status then
          print('pcall failed --> Error: ' .. err)
        else
          print("pcall success.")
        end
      end
    )

    Handlers.once(
      "transferAward",
      { Action = "TransferAward" },
      function(msg)
        local response = Send({ Target = STORY_PROCESS, Action = "GetVoteAddress", Data = data }).receive().Data
        print("getVoteAddress: " .. response)

        local address  = json.decode(response)

        if type(address) ~= "table" or #address == 0 then
          -- if no one to vote then transfer token back to Owner
          response = Send({
            Target = TOKEN_PROCESS,
            Action = "Transfer",
            Recipient = Owner,
            Quantity = tostring(token_amount)
          }).receive().Data
          print("Returned all token to Owner: " .. response)
        else
          local quantity = math.floor(token_amount / #address)
          local remainder = token_amount % #address
          print("votes: " .. #address)
          print("quantity per voter: " .. quantity)
          print("remainder: " .. remainder)

          for _, value in ipairs(address) do
            response = Send({
              Target = TOKEN_PROCESS,
              Action = "Transfer",
              Recipient = value.address,
              Quantity = tostring(quantity)
            }).receive().Data
            print(response)
          end

          -- 将余数返还给 Owner
          if remainder > 0 then
            response = Send({
              Target = TOKEN_PROCESS,
              Action = "Transfer",
              Recipient = Owner,
              Quantity = tostring(remainder)
            }).receive().Data
            print("Returned remainder: " .. response)
          end
        end
      end
    )
  `;

  return CODE;
}

export function isValidPositiveNumber(input: any) {
  // 将输入转换为数字
  const number = parseFloat(input);

  // 检查是否为有效的数字且大于零
  if (!isNaN(number) && number > 0) {
    return true;
  }
  return false;
}