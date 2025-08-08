import { createOffchainClient } from "@thenamespace/offchain-manager";
const client = createOffchainClient({
    mode: "mainnet"
});

client.setApiKey("deptofagri.eth", process.env.NAMESPACE_API_KEY || "");

export default client;