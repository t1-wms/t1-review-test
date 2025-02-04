"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPullRequest = processPullRequest;
const axios_1 = __importDefault(require("axios"));
const env_1 = __importDefault(require("./env"));
const strategies_1 = require("./strategies");
async function processPullRequest(prNumber) {
  console.log(`🚀 Fetching changed files for PR #${prNumber}...`);
  try {
    const url = `https://api.github.com/repos/${env_1.default.REPO_OWNER}/${env_1.default.REPO_NAME}/pulls/${prNumber}/files`;
    const response = await axios_1.default.get(url, {
      headers: {
        Authorization: `Bearer ${env_1.default.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const files = response.data;
    let patchContents = "";
    for (const file of files) {
      if (file.patch) {
        patchContents += `File: ${file.filename}\n${file.patch}\n\n`;
      }
    }
    if (!patchContents) {
      console.log("😅 변경된 코드 없음.");
      return;
    }
    const reviewTopics = await (0, strategies_1.generateReviewTopics)(
      patchContents
    );
    const commentBody = `### AI 코드 리뷰 주제 추천\n\n${reviewTopics}`;
    await postComment(prNumber, commentBody);
  } catch (e) {
    const error = e;
    console.error(
      `❌ PR #${prNumber} 처리 실패:`,
      error.response?.data || error.message
    );
  }
}
// PR에 댓글 작성 함수
async function postComment(prNumber, message) {
  try {
    const url = `https://api.github.com/repos/${env_1.default.REPO_OWNER}/${env_1.default.REPO_NAME}/issues/${prNumber}/comments`;
    await axios_1.default.post(
      url,
      { body: message },
      {
        headers: {
          Authorization: `Bearer ${env_1.default.GH_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    console.log(`✅ PR #${prNumber}에 댓글 추가 성공!`);
  } catch (e) {
    const error = e;
    console.error(
      `❌ PR #${prNumber} 댓글 추가 실패:`,
      error.response?.data || error.message
    );
  }
}
