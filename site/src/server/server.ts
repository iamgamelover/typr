
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

export async function getProcessFromOwner(owner: string) {
  let start = performance.now();
  console.log('==> [getProcessFromOwner]');

  const queryObject = {
    query:
      `{
        transactions (
          first: 1
          owners: "${owner}"
          tags: [
            { name: "Data-Protocol", values: ["ao"] },
            { name: "Type", values: ["Process"] },
            { name: "Name", values: ["default"] }
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
    console.log("response:", response)

    let end = performance.now();
    console.log(`<== [getProcessFromOwner] [${Math.round(end - start)} ms]`);

    if (response.length == 0)
      return { success: true, process: '' };
    else
      return { success: true, process: response[0].node.id };
  } catch (error) {
    console.log("ERR:", error);
    return { success: false, message: 'getPostsOfMission failed.' };
  }
}
