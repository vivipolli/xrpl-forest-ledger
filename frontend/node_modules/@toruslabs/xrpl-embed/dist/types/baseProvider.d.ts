import { JRPCEngine, JRPCRequest, RequestArguments, SafeEventEmitter, SafeEventEmitterProvider, SendCallBack } from "@toruslabs/openlogin-jrpc";
import type { Duplex } from "readable-stream";
import { BaseProviderState, Maybe, ProviderOptions, UnValidatedJsonRpcRequest } from "./interfaces";
/**
 * @param connectionStream - A Node.js duplex stream
 * @param opts - An options bag
 */
declare abstract class BaseProvider<U extends BaseProviderState> extends SafeEventEmitter implements SafeEventEmitterProvider {
    _rpcEngine: JRPCEngine;
    jsonRpcConnectionEvents: SafeEventEmitter;
    /**
     * Indicating that this provider is a Torus provider.
     */
    readonly isTorus: true;
    protected _state: U;
    constructor(connectionStream: Duplex, { maxEventListeners, jsonRpcStreamName }: ProviderOptions);
    /**
     * Submits an RPC request for the given method, with the given params.
     * Resolves with the result of the method call, or rejects on error.
     *
     * @param args - The RPC request arguments.
     * @returns A Promise that resolves with the result of the RPC method,
     * or rejects if an error is encountered.
     */
    request<T, P>(args: RequestArguments<T>): Promise<Maybe<P>>;
    send<T, V>(req: JRPCRequest<T>, callback: SendCallBack<V>): void;
    sendAsync<T, V>(req: JRPCRequest<T>): Promise<V>;
    /**
     * Called when connection is lost to critical streams.
     *
     * emits TorusInpageProvider#disconnect
     */
    protected _handleStreamDisconnect(streamName: string, error: Error): void;
    /**
     * Constructor helper.
     * Populates initial state by calling 'wallet_getProviderState' and emits
     * necessary events.
     */
    abstract _initializeState(...args: unknown[]): Promise<void>;
    /**
     * Internal RPC method. Forwards requests to background via the RPC engine.
     * Also remap ids inbound and outbound
     */
    protected abstract _rpcRequest(payload: UnValidatedJsonRpcRequest | UnValidatedJsonRpcRequest[], callback: (...args: unknown[]) => void, isInternal?: boolean): void;
    /**
     * When the provider becomes connected, updates internal state and emits
     * required events. Idempotent.
     *
     * @param chainId - The ID of the newly connected chain.
     * emits TorusInPageProvider#connect
     */
    protected abstract _handleConnect(...args: unknown[]): void;
    /**
     * When the provider becomes disconnected, updates internal state and emits
     * required events. Idempotent with respect to the isRecoverable parameter.
     *
     * Error codes per the CloseEvent status codes as required by EIP-1193:
     * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
     *
     * @param isRecoverable - Whether the disconnection is recoverable.
     * @param errorMessage - A custom error message.
     * emits TorusInpageProvider#disconnect
     */
    protected abstract _handleDisconnect(isRecoverable: boolean, errorMessage?: string): void;
}
export default BaseProvider;
