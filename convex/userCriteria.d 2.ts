export declare const getCriteria: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<{
    property_types: string[];
    location: string;
    min_purchase_price: number;
    max_purchase_price: number;
    downpayment_percentage_min: number;
    downpayment_percentage_max: number;
    closing_costs_percentage_min: number;
    closing_costs_percentage_max: number;
    initial_fixed_costs_percentage: number;
    maintenance_reserve_percentage: number;
    coc_benchmark_min: number;
    coc_benchmark_max: number;
    coc_minimum_min: number;
    coc_minimum_max: number;
    cap_benchmark_min: number;
    cap_benchmark_max: number;
    cap_minimum: number;
    str_adr_minimum?: number | undefined;
    str_occupancy_rate_minimum?: number | undefined;
    str_gross_yield_minimum?: number | undefined;
    str_annual_revenue_minimum?: number | undefined;
} | null>>;
export declare const updateCriteria: import("convex/server").RegisteredMutation<"public", {
    userId: string;
    max_purchase_price: number;
    coc_minimum_min: number;
    coc_minimum_max: number;
    coc_benchmark_min: number;
    coc_benchmark_max: number;
    cap_minimum: number;
    cap_benchmark_min: number;
    cap_benchmark_max: number;
}, Promise<{
    _id: import("convex/values").GenericId<"userCriteria">;
    _creationTime: number;
    updatedAt: number;
    userId: string;
    max_purchase_price: number;
    coc_minimum_min: number;
    coc_minimum_max: number;
    coc_benchmark_min: number;
    coc_benchmark_max: number;
    cap_minimum: number;
    cap_benchmark_min: number;
    cap_benchmark_max: number;
} | null>>;
//# sourceMappingURL=userCriteria.d.ts.map