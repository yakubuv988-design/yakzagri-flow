import {
  EXPLORER_LINK_PROPS,
  getActiveStellarNetwork,
  getExplorerTxUrl,
  getHorizonTxUrl,
} from "../format";

const HASH = "a".repeat(64);

describe("explorer URL helpers", () => {
  const original = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
    else process.env.NEXT_PUBLIC_STELLAR_NETWORK = original;
  });

  it("builds a testnet StellarExpert URL", () => {
    expect(getExplorerTxUrl(HASH, "testnet")).toBe(`https://stellar.expert/explorer/testnet/tx/${HASH}`);
  });

  it("builds a mainnet StellarExpert URL", () => {
    expect(getExplorerTxUrl(HASH, "public")).toBe(`https://stellar.expert/explorer/public/tx/${HASH}`);
  });

  it("follows the active network from env and defaults to testnet", () => {
    delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
    expect(getActiveStellarNetwork()).toBe("testnet");
    expect(getExplorerTxUrl(HASH)).toContain("/testnet/");
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = "public";
    expect(getExplorerTxUrl(HASH)).toContain("/public/");
  });

  it("encodes untrusted hashes", () => {
    expect(getExplorerTxUrl("../x?y", "public")).toBe("https://stellar.expert/explorer/public/tx/..%2Fx%3Fy");
  });

  it("builds Horizon URLs per network", () => {
    expect(getHorizonTxUrl(HASH, "testnet")).toBe(`https://horizon-testnet.stellar.org/transactions/${HASH}`);
    expect(getHorizonTxUrl(HASH, "public")).toBe(`https://horizon.stellar.org/transactions/${HASH}`);
  });

  it("exposes secure link attributes", () => {
    expect(EXPLORER_LINK_PROPS).toEqual({ target: "_blank", rel: "noopener noreferrer" });
  });
});
