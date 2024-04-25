// export const AO_TWITTER = "Y4ZXUT9jFoHFg3K2XH5MVFf4_mXKHAcCsqgLta1au2U";
// export const AO_TWITTER = "Ekm_mCHSs9mawVqwqTi35qBaT-8DaORzYJ-c9Z3qMhY";
// export const AO_STORY = "Ur_5hhtX6zQEpFg9jPzFULMTLRvkBfp4bn7Od4Qj4Jk";

export const AO_TWITTER = "8s1ZpAx_NueKS4N2ZOMYWCkl5qVcGkgnBFSnqSVX9Fo";
export const AO_STORY = "AAwa2zqVLSMvxOPMjhUVtPHS_SN1ObbsaY27X9OPCbw";
export const STORY_INCOME = "LsNy8F1GSkGvE0IJ6g1RFpHHjKE6tmtXUT91WIv3PMQ";
export const CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc";
export const AOT_TEST = "UabERwDSwechOsHg9M1N6qTk2O7EXPf63qABDTAj_Vs";
export const CHATROOM = "F__i_YGIUOGw43zyqLY9dEKNNEhB_uTqzL9tOTWJ-KA";
export const TIP_IMG = "Is there a picture in the post? Size just up to 100KB for now.";
export const ICON_SIZE = 28;
export const PAGE_SIZE = "10";
// export const MODULE = "Kb9_Qnn_Ih5bLE5J8XnCXKatwxriS8ZGFfeEZFu1fjw"
// export const SCHEDULER = "TZ7o7SIZ06ZEJ14lXwVtng1EtSx60QkPy-kh-kdAXog"
export const MODULE = "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk"
export const SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"
export const ARWEAVE_GATEWAY = "https://arweave.net/";

export const LUA =
  `
  AOT_TEST = "UabERwDSwechOsHg9M1N6qTk2O7EXPf63qABDTAj_Vs";
  
  Handlers.add(
    "TransferAOT",
    Handlers.utils.hasMatchingTag("Action", "TransferAOT"),
    function(msg)
      if msg.From == Owner then
        ao.send({
          Target = AOT_TEST,
          Action = "Transfer",
          Recipient = msg.Tags.Recipient,
          Quantity = msg.Tags.Quantity
        })
      end
    end
  )
`;