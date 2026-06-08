import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
interface RateLimitConfig {
    windowMs?: number;
    max?: number;
    keyByUser?: boolean;
}
export declare const RateLimit: (config?: RateLimitConfig) => (_target: any, _key?: string, descriptor?: any) => any;
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export {};
