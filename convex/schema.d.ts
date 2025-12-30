declare const _default: import("convex/server").SchemaDefinition<{
    messages: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        body: string;
        author: string;
    }, {
        author: import("convex/values").VString<string, "required">;
        body: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "body" | "author">, {
        by_author: ["author", "_creationTime"];
    }, {}, {}>;
    emailDeals: import("convex/server").TableDefinition<import("convex/values").VObject<{
        extractedProperty?: {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
                type: "listing" | "company" | "external" | "other";
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
            }[] | undefined;
        } | undefined;
        contentHash?: string | undefined;
        analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
        status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
        emailContent: string;
        subject: string;
        sender: string;
        receivedDate: number;
        userId: string;
        gmailId: string;
    }, {
        userId: import("convex/values").VString<string, "required">;
        gmailId: import("convex/values").VString<string, "required">;
        subject: import("convex/values").VString<string, "required">;
        sender: import("convex/values").VString<string, "required">;
        receivedDate: import("convex/values").VFloat64<number, "required">;
        emailContent: import("convex/values").VString<string, "required">;
        contentHash: import("convex/values").VString<string | undefined, "optional">;
        status: import("convex/values").VUnion<"new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested", [import("convex/values").VLiteral<"new", "required">, import("convex/values").VLiteral<"reviewed", "required">, import("convex/values").VLiteral<"analyzed", "required">, import("convex/values").VLiteral<"archived", "required">, import("convex/values").VLiteral<"pending", "required">, import("convex/values").VLiteral<"interested", "required">, import("convex/values").VLiteral<"not_interested", "required">], "required", never>;
        extractedProperty: import("convex/values").VObject<{
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
                type: "listing" | "company" | "external" | "other";
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
            }[] | undefined;
        } | undefined, {
            address: import("convex/values").VString<string | undefined, "optional">;
            city: import("convex/values").VString<string | undefined, "optional">;
            state: import("convex/values").VString<string | undefined, "optional">;
            price: import("convex/values").VFloat64<number | undefined, "optional">;
            monthlyRent: import("convex/values").VFloat64<number | undefined, "optional">;
            bedrooms: import("convex/values").VFloat64<number | undefined, "optional">;
            bathrooms: import("convex/values").VFloat64<number | undefined, "optional">;
            sqft: import("convex/values").VFloat64<number | undefined, "optional">;
            adr: import("convex/values").VFloat64<number | undefined, "optional">;
            occupancyRate: import("convex/values").VFloat64<number | undefined, "optional">;
            imageUrls: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
            sourceLinks: import("convex/values").VArray<{
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
                type: "listing" | "company" | "external" | "other";
            }[] | undefined, import("convex/values").VObject<{
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
                type: "listing" | "company" | "external" | "other";
            }, {
                url: import("convex/values").VString<string, "required">;
                type: import("convex/values").VUnion<"listing" | "company" | "external" | "other", [import("convex/values").VLiteral<"listing", "required">, import("convex/values").VLiteral<"company", "required">, import("convex/values").VLiteral<"external", "required">, import("convex/values").VLiteral<"other", "required">], "required", never>;
                description: import("convex/values").VString<string | undefined, "optional">;
                aiScore: import("convex/values").VFloat64<number | undefined, "optional">;
                aiCategory: import("convex/values").VUnion<"excellent" | "good" | "fair" | "poor" | undefined, [import("convex/values").VLiteral<"excellent", "required">, import("convex/values").VLiteral<"good", "required">, import("convex/values").VLiteral<"fair", "required">, import("convex/values").VLiteral<"poor", "required">], "optional", never>;
                aiReasoning: import("convex/values").VString<string | undefined, "optional">;
            }, "required", "url" | "description" | "aiScore" | "type" | "aiCategory" | "aiReasoning">, "optional">;
            imageScores: import("convex/values").VArray<{
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
            }[] | undefined, import("convex/values").VObject<{
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
                url: string;
            }, {
                url: import("convex/values").VString<string, "required">;
                aiScore: import("convex/values").VFloat64<number | undefined, "optional">;
                aiCategory: import("convex/values").VUnion<"excellent" | "good" | "fair" | "poor" | undefined, [import("convex/values").VLiteral<"excellent", "required">, import("convex/values").VLiteral<"good", "required">, import("convex/values").VLiteral<"fair", "required">, import("convex/values").VLiteral<"poor", "required">], "optional", never>;
                aiReasoning: import("convex/values").VString<string | undefined, "optional">;
            }, "required", "url" | "aiScore" | "aiCategory" | "aiReasoning">, "optional">;
        }, "optional", "address" | "city" | "state" | "monthlyRent" | "bedrooms" | "bathrooms" | "imageUrls" | "sourceLinks" | "adr" | "occupancyRate" | "price" | "sqft" | "imageScores">;
        analysisId: import("convex/values").VId<import("convex/values").GenericId<"dealAnalyses"> | undefined, "optional">;
    }, "required", "status" | "emailContent" | "subject" | "sender" | "receivedDate" | "userId" | "extractedProperty" | "contentHash" | "gmailId" | "analysisId" | "extractedProperty.address" | "extractedProperty.city" | "extractedProperty.state" | "extractedProperty.monthlyRent" | "extractedProperty.bedrooms" | "extractedProperty.bathrooms" | "extractedProperty.imageUrls" | "extractedProperty.sourceLinks" | "extractedProperty.adr" | "extractedProperty.occupancyRate" | "extractedProperty.price" | "extractedProperty.sqft" | "extractedProperty.imageScores">, {
        by_user_id: ["userId", "_creationTime"];
        by_gmail_id: ["gmailId", "_creationTime"];
        by_content_hash: ["contentHash", "_creationTime"];
        by_status: ["status", "_creationTime"];
        by_received_date: ["receivedDate", "_creationTime"];
    }, {}, {}>;
    dealAnalyses: import("convex/server").TableDefinition<import("convex/values").VObject<{
        aiAnalysis?: {
            summary: string;
            pros: string[];
            cons: string[];
            riskLevel: "low" | "medium" | "high";
            recommendedAction: "buy" | "pass" | "investigate";
            confidence: number;
        } | undefined;
        monthlyExpenses: number;
        analysisDate: number;
        property: {
            id?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            zipCode?: string | undefined;
            propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            squareFootage?: number | undefined;
            yearBuilt?: number | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            address: string;
            purchasePrice: number;
        };
        totalCashNeeded: number;
        cashFlow: number;
        cocReturn: number;
        capRate: number;
        meetsCriteria: boolean;
        userId: string;
        monthlyIncome: number;
        criteria: {
            strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
            targetCoCReturn: number;
            targetCapRate: number;
            maxLoanToValue: number;
            vacancyRate: number;
            maintenanceRate: number;
            managementRate: number;
            expectedAppreciation: number;
        };
    }, {
        userId: import("convex/values").VString<string, "required">;
        property: import("convex/values").VObject<{
            id?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            zipCode?: string | undefined;
            propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            squareFootage?: number | undefined;
            yearBuilt?: number | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            address: string;
            purchasePrice: number;
        }, {
            id: import("convex/values").VString<string | undefined, "optional">;
            address: import("convex/values").VString<string, "required">;
            city: import("convex/values").VString<string | undefined, "optional">;
            state: import("convex/values").VString<string | undefined, "optional">;
            zipCode: import("convex/values").VString<string | undefined, "optional">;
            purchasePrice: import("convex/values").VFloat64<number, "required">;
            monthlyRent: import("convex/values").VFloat64<number | undefined, "optional">;
            bedrooms: import("convex/values").VFloat64<number | undefined, "optional">;
            bathrooms: import("convex/values").VFloat64<number | undefined, "optional">;
            squareFootage: import("convex/values").VFloat64<number | undefined, "optional">;
            yearBuilt: import("convex/values").VFloat64<number | undefined, "optional">;
            propertyType: import("convex/values").VUnion<"single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined, [import("convex/values").VLiteral<"single-family", "required">, import("convex/values").VLiteral<"multi-family", "required">, import("convex/values").VLiteral<"condo", "required">, import("convex/values").VLiteral<"townhouse", "required">, import("convex/values").VLiteral<"duplex", "required">, import("convex/values").VLiteral<"commercial", "required">], "optional", never>;
            adr: import("convex/values").VFloat64<number | undefined, "optional">;
            occupancyRate: import("convex/values").VFloat64<number | undefined, "optional">;
        }, "required", "id" | "address" | "city" | "state" | "zipCode" | "propertyType" | "purchasePrice" | "monthlyRent" | "bedrooms" | "bathrooms" | "squareFootage" | "yearBuilt" | "adr" | "occupancyRate">;
        monthlyIncome: import("convex/values").VFloat64<number, "required">;
        monthlyExpenses: import("convex/values").VFloat64<number, "required">;
        cashFlow: import("convex/values").VFloat64<number, "required">;
        cocReturn: import("convex/values").VFloat64<number, "required">;
        capRate: import("convex/values").VFloat64<number, "required">;
        totalCashNeeded: import("convex/values").VFloat64<number, "required">;
        meetsCriteria: import("convex/values").VBoolean<boolean, "required">;
        criteria: import("convex/values").VObject<{
            strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
            targetCoCReturn: number;
            targetCapRate: number;
            maxLoanToValue: number;
            vacancyRate: number;
            maintenanceRate: number;
            managementRate: number;
            expectedAppreciation: number;
        }, {
            strategy: import("convex/values").VUnion<"conservative" | "aggressive" | "brrrr" | "moderate", [import("convex/values").VLiteral<"conservative", "required">, import("convex/values").VLiteral<"moderate", "required">, import("convex/values").VLiteral<"aggressive", "required">, import("convex/values").VLiteral<"brrrr", "required">], "required", never>;
            targetCoCReturn: import("convex/values").VFloat64<number, "required">;
            targetCapRate: import("convex/values").VFloat64<number, "required">;
            maxLoanToValue: import("convex/values").VFloat64<number, "required">;
            vacancyRate: import("convex/values").VFloat64<number, "required">;
            maintenanceRate: import("convex/values").VFloat64<number, "required">;
            managementRate: import("convex/values").VFloat64<number, "required">;
            expectedAppreciation: import("convex/values").VFloat64<number, "required">;
        }, "required", "strategy" | "targetCoCReturn" | "targetCapRate" | "maxLoanToValue" | "vacancyRate" | "maintenanceRate" | "managementRate" | "expectedAppreciation">;
        aiAnalysis: import("convex/values").VObject<{
            summary: string;
            pros: string[];
            cons: string[];
            riskLevel: "low" | "medium" | "high";
            recommendedAction: "buy" | "pass" | "investigate";
            confidence: number;
        } | undefined, {
            summary: import("convex/values").VString<string, "required">;
            pros: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
            cons: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
            riskLevel: import("convex/values").VUnion<"low" | "medium" | "high", [import("convex/values").VLiteral<"low", "required">, import("convex/values").VLiteral<"medium", "required">, import("convex/values").VLiteral<"high", "required">], "required", never>;
            recommendedAction: import("convex/values").VUnion<"buy" | "pass" | "investigate", [import("convex/values").VLiteral<"buy", "required">, import("convex/values").VLiteral<"pass", "required">, import("convex/values").VLiteral<"investigate", "required">], "required", never>;
            confidence: import("convex/values").VFloat64<number, "required">;
        }, "optional", "summary" | "pros" | "cons" | "riskLevel" | "recommendedAction" | "confidence">;
        analysisDate: import("convex/values").VFloat64<number, "required">;
    }, "required", "monthlyExpenses" | "analysisDate" | "property" | "totalCashNeeded" | "cashFlow" | "cocReturn" | "capRate" | "meetsCriteria" | "aiAnalysis" | "userId" | "monthlyIncome" | "criteria" | "property.id" | "property.address" | "property.city" | "property.state" | "property.zipCode" | "property.propertyType" | "property.purchasePrice" | "property.monthlyRent" | "property.bedrooms" | "property.bathrooms" | "property.squareFootage" | "property.yearBuilt" | "property.adr" | "property.occupancyRate" | "aiAnalysis.summary" | "aiAnalysis.pros" | "aiAnalysis.cons" | "aiAnalysis.riskLevel" | "aiAnalysis.recommendedAction" | "aiAnalysis.confidence" | "criteria.strategy" | "criteria.targetCoCReturn" | "criteria.targetCapRate" | "criteria.maxLoanToValue" | "criteria.vacancyRate" | "criteria.maintenanceRate" | "criteria.managementRate" | "criteria.expectedAppreciation">, {
        by_user_id: ["userId", "_creationTime"];
        by_address: ["property.address", "_creationTime"];
        by_analysis_date: ["analysisDate", "_creationTime"];
        by_meets_criteria: ["meetsCriteria", "_creationTime"];
        by_cash_flow: ["cashFlow", "_creationTime"];
        by_coc_return: ["cocReturn", "_creationTime"];
    }, {}, {}>;
    properties: import("convex/server").TableDefinition<import("convex/values").VObject<{
        city?: string | undefined;
        state?: string | undefined;
        zipCode?: string | undefined;
        propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        squareFootage?: number | undefined;
        yearBuilt?: number | undefined;
        address: string;
        purchasePrice: number;
    }, {
        address: import("convex/values").VString<string, "required">;
        city: import("convex/values").VString<string | undefined, "optional">;
        state: import("convex/values").VString<string | undefined, "optional">;
        zipCode: import("convex/values").VString<string | undefined, "optional">;
        purchasePrice: import("convex/values").VFloat64<number, "required">;
        monthlyRent: import("convex/values").VFloat64<number | undefined, "optional">;
        bedrooms: import("convex/values").VFloat64<number | undefined, "optional">;
        bathrooms: import("convex/values").VFloat64<number | undefined, "optional">;
        squareFootage: import("convex/values").VFloat64<number | undefined, "optional">;
        yearBuilt: import("convex/values").VFloat64<number | undefined, "optional">;
        propertyType: import("convex/values").VUnion<"single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined, [import("convex/values").VLiteral<"single-family", "required">, import("convex/values").VLiteral<"multi-family", "required">, import("convex/values").VLiteral<"condo", "required">, import("convex/values").VLiteral<"townhouse", "required">, import("convex/values").VLiteral<"duplex", "required">, import("convex/values").VLiteral<"commercial", "required">], "optional", never>;
    }, "required", "address" | "city" | "state" | "zipCode" | "propertyType" | "purchasePrice" | "monthlyRent" | "bedrooms" | "bathrooms" | "squareFootage" | "yearBuilt">, {
        by_address: ["address", "_creationTime"];
        by_city_state: ["city", "state", "_creationTime"];
    }, {}, {}>;
    propertyComparisons: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        name: string;
        propertyIds: import("convex/values").GenericId<"dealAnalyses">[];
    }, {
        name: import("convex/values").VString<string, "required">;
        propertyIds: import("convex/values").VArray<import("convex/values").GenericId<"dealAnalyses">[], import("convex/values").VId<import("convex/values").GenericId<"dealAnalyses">, "required">, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "name" | "propertyIds">, {
        by_created_at: ["createdAt", "_creationTime"];
    }, {}, {}>;
    neighborhoodTrends: import("convex/server").TableDefinition<import("convex/values").VObject<{
        city: string;
        state: string;
        neighborhood: string;
        averagePrice: number;
        priceChangePercent3Month: number;
        priceChangePercent6Month: number;
        priceChangePercent1Year: number;
        averageRent: number;
        rentChangePercent3Month: number;
        rentChangePercent6Month: number;
        rentChangePercent1Year: number;
        daysOnMarket: number;
        pricePerSqft: number;
        rentYield: number;
        marketHeat: "hot" | "warm" | "balanced" | "cool";
        lastUpdated: number;
    }, {
        neighborhood: import("convex/values").VString<string, "required">;
        city: import("convex/values").VString<string, "required">;
        state: import("convex/values").VString<string, "required">;
        averagePrice: import("convex/values").VFloat64<number, "required">;
        priceChangePercent3Month: import("convex/values").VFloat64<number, "required">;
        priceChangePercent6Month: import("convex/values").VFloat64<number, "required">;
        priceChangePercent1Year: import("convex/values").VFloat64<number, "required">;
        averageRent: import("convex/values").VFloat64<number, "required">;
        rentChangePercent3Month: import("convex/values").VFloat64<number, "required">;
        rentChangePercent6Month: import("convex/values").VFloat64<number, "required">;
        rentChangePercent1Year: import("convex/values").VFloat64<number, "required">;
        daysOnMarket: import("convex/values").VFloat64<number, "required">;
        pricePerSqft: import("convex/values").VFloat64<number, "required">;
        rentYield: import("convex/values").VFloat64<number, "required">;
        marketHeat: import("convex/values").VUnion<"hot" | "warm" | "balanced" | "cool", [import("convex/values").VLiteral<"hot", "required">, import("convex/values").VLiteral<"warm", "required">, import("convex/values").VLiteral<"balanced", "required">, import("convex/values").VLiteral<"cool", "required">], "required", never>;
        lastUpdated: import("convex/values").VFloat64<number, "required">;
    }, "required", "city" | "state" | "neighborhood" | "averagePrice" | "priceChangePercent3Month" | "priceChangePercent6Month" | "priceChangePercent1Year" | "averageRent" | "rentChangePercent3Month" | "rentChangePercent6Month" | "rentChangePercent1Year" | "daysOnMarket" | "pricePerSqft" | "rentYield" | "marketHeat" | "lastUpdated">, {
        by_city_state: ["city", "state", "_creationTime"];
        by_last_updated: ["lastUpdated", "_creationTime"];
    }, {}, {}>;
    comparableSales: import("convex/server").TableDefinition<import("convex/values").VObject<{
        yearBuilt?: number | undefined;
        distance?: number | undefined;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        createdAt: number;
        pricePerSqft: number;
        salePrice: number;
        saleDate: number;
    }, {
        address: import("convex/values").VString<string, "required">;
        city: import("convex/values").VString<string, "required">;
        state: import("convex/values").VString<string, "required">;
        zipCode: import("convex/values").VString<string, "required">;
        salePrice: import("convex/values").VFloat64<number, "required">;
        pricePerSqft: import("convex/values").VFloat64<number, "required">;
        bedrooms: import("convex/values").VFloat64<number, "required">;
        bathrooms: import("convex/values").VFloat64<number, "required">;
        squareFootage: import("convex/values").VFloat64<number, "required">;
        yearBuilt: import("convex/values").VFloat64<number | undefined, "optional">;
        propertyType: import("convex/values").VString<string, "required">;
        saleDate: import("convex/values").VFloat64<number, "required">;
        distance: import("convex/values").VFloat64<number | undefined, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "address" | "city" | "state" | "zipCode" | "propertyType" | "bedrooms" | "bathrooms" | "squareFootage" | "yearBuilt" | "createdAt" | "pricePerSqft" | "salePrice" | "saleDate" | "distance">, {
        by_city_state: ["city", "state", "_creationTime"];
        by_sale_date: ["saleDate", "_creationTime"];
    }, {}, {}>;
    marketHeatMapData: import("convex/server").TableDefinition<import("convex/values").VObject<{
        city: string;
        state: string;
        zipCode: string;
        averagePrice: number;
        averageRent: number;
        lastUpdated: number;
        latitude: number;
        longitude: number;
        priceChangePercent: number;
        rentChangePercent: number;
        dealVolume: number;
        investmentScore: number;
        heatLevel: "hot" | "warm" | "balanced" | "cool" | "very_hot";
    }, {
        zipCode: import("convex/values").VString<string, "required">;
        city: import("convex/values").VString<string, "required">;
        state: import("convex/values").VString<string, "required">;
        latitude: import("convex/values").VFloat64<number, "required">;
        longitude: import("convex/values").VFloat64<number, "required">;
        heatLevel: import("convex/values").VUnion<"hot" | "warm" | "balanced" | "cool" | "very_hot", [import("convex/values").VLiteral<"very_hot", "required">, import("convex/values").VLiteral<"hot", "required">, import("convex/values").VLiteral<"warm", "required">, import("convex/values").VLiteral<"balanced", "required">, import("convex/values").VLiteral<"cool", "required">], "required", never>;
        averagePrice: import("convex/values").VFloat64<number, "required">;
        priceChangePercent: import("convex/values").VFloat64<number, "required">;
        averageRent: import("convex/values").VFloat64<number, "required">;
        rentChangePercent: import("convex/values").VFloat64<number, "required">;
        investmentScore: import("convex/values").VFloat64<number, "required">;
        dealVolume: import("convex/values").VFloat64<number, "required">;
        lastUpdated: import("convex/values").VFloat64<number, "required">;
    }, "required", "city" | "state" | "zipCode" | "averagePrice" | "averageRent" | "lastUpdated" | "latitude" | "longitude" | "priceChangePercent" | "rentChangePercent" | "dealVolume" | "investmentScore" | "heatLevel">, {
        by_zip_code: ["zipCode", "_creationTime"];
        by_city_state: ["city", "state", "_creationTime"];
        by_investment_score: ["investmentScore", "_creationTime"];
    }, {}, {}>;
    savedFilters: import("convex/server").TableDefinition<import("convex/values").VObject<{
        isSystem?: boolean | undefined;
        description: string;
        createdAt: number;
        updatedAt: number;
        name: string;
        filterCriteria: any;
        usageCount: number;
    }, {
        name: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "required">;
        filterCriteria: import("convex/values").VAny<any, "required", string>;
        isSystem: import("convex/values").VBoolean<boolean | undefined, "optional">;
        usageCount: import("convex/values").VFloat64<number, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "description" | "createdAt" | "updatedAt" | "name" | "filterCriteria" | "isSystem" | "usageCount" | `filterCriteria.${string}`>, {
        by_usage_count: ["usageCount", "_creationTime"];
        by_created_at: ["createdAt", "_creationTime"];
    }, {}, {}>;
    searchHistory: import("convex/server").TableDefinition<import("convex/values").VObject<{
        query: string;
        parsedCriteria: any;
        resultCount: number;
        searchDate: number;
    }, {
        query: import("convex/values").VString<string, "required">;
        parsedCriteria: import("convex/values").VAny<any, "required", string>;
        resultCount: import("convex/values").VFloat64<number, "required">;
        searchDate: import("convex/values").VFloat64<number, "required">;
    }, "required", "query" | "parsedCriteria" | "resultCount" | "searchDate" | `parsedCriteria.${string}`>, {
        by_search_date: ["searchDate", "_creationTime"];
    }, {}, {}>;
    photoAnalyses: import("convex/server").TableDefinition<import("convex/values").VObject<{
        aiScore?: number | undefined;
        aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
        aiReasoning?: string | undefined;
        features?: string[] | undefined;
        issues?: string[] | undefined;
        analysisDate: number;
        propertyId: string;
        photoUrl: string;
    }, {
        propertyId: import("convex/values").VString<string, "required">;
        photoUrl: import("convex/values").VString<string, "required">;
        analysisDate: import("convex/values").VFloat64<number, "required">;
        aiScore: import("convex/values").VFloat64<number | undefined, "optional">;
        aiCategory: import("convex/values").VUnion<"excellent" | "good" | "fair" | "poor" | undefined, [import("convex/values").VLiteral<"excellent", "required">, import("convex/values").VLiteral<"good", "required">, import("convex/values").VLiteral<"fair", "required">, import("convex/values").VLiteral<"poor", "required">], "optional", never>;
        aiReasoning: import("convex/values").VString<string | undefined, "optional">;
        features: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
        issues: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
    }, "required", "analysisDate" | "propertyId" | "aiScore" | "aiCategory" | "aiReasoning" | "photoUrl" | "features" | "issues">, {
        by_property_id: ["propertyId", "_creationTime"];
        by_analysis_date: ["analysisDate", "_creationTime"];
    }, {}, {}>;
    userOAuthTokens: import("convex/server").TableDefinition<import("convex/values").VObject<{
        scope?: string | undefined;
        expiryDate?: number | undefined;
        tokenType?: string | undefined;
        updatedAt: number;
        userId: string;
        accessToken: string;
        refreshToken: string;
    }, {
        userId: import("convex/values").VString<string, "required">;
        accessToken: import("convex/values").VString<string, "required">;
        refreshToken: import("convex/values").VString<string, "required">;
        scope: import("convex/values").VString<string | undefined, "optional">;
        expiryDate: import("convex/values").VFloat64<number | undefined, "optional">;
        tokenType: import("convex/values").VString<string | undefined, "optional">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "updatedAt" | "userId" | "accessToken" | "refreshToken" | "scope" | "expiryDate" | "tokenType">, {
        by_user_id: ["userId", "_creationTime"];
    }, {}, {}>;
    emailPreferences: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: string;
        notifyOnNewDeals: boolean;
        notifyOnAnalysisComplete: boolean;
        notifyOnCriteriaMatch: boolean;
        notifyOnWeeklySummary: boolean;
        frequency: "immediate" | "daily" | "weekly";
        email: string;
    }, {
        userId: import("convex/values").VString<string, "required">;
        notifyOnNewDeals: import("convex/values").VBoolean<boolean, "required">;
        notifyOnAnalysisComplete: import("convex/values").VBoolean<boolean, "required">;
        notifyOnCriteriaMatch: import("convex/values").VBoolean<boolean, "required">;
        notifyOnWeeklySummary: import("convex/values").VBoolean<boolean, "required">;
        frequency: import("convex/values").VUnion<"immediate" | "daily" | "weekly", [import("convex/values").VLiteral<"immediate", "required">, import("convex/values").VLiteral<"daily", "required">, import("convex/values").VLiteral<"weekly", "required">], "required", never>;
        email: import("convex/values").VString<string, "required">;
    }, "required", "userId" | "notifyOnNewDeals" | "notifyOnAnalysisComplete" | "notifyOnCriteriaMatch" | "notifyOnWeeklySummary" | "frequency" | "email">, {
        by_user_id: ["userId", "_creationTime"];
    }, {}, {}>;
    userCriteria: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        userId: import("convex/values").VString<string, "required">;
        max_purchase_price: import("convex/values").VFloat64<number, "required">;
        coc_minimum_min: import("convex/values").VFloat64<number, "required">;
        coc_minimum_max: import("convex/values").VFloat64<number, "required">;
        coc_benchmark_min: import("convex/values").VFloat64<number, "required">;
        coc_benchmark_max: import("convex/values").VFloat64<number, "required">;
        cap_minimum: import("convex/values").VFloat64<number, "required">;
        cap_benchmark_min: import("convex/values").VFloat64<number, "required">;
        cap_benchmark_max: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "updatedAt" | "userId" | "max_purchase_price" | "coc_minimum_min" | "coc_minimum_max" | "coc_benchmark_min" | "coc_benchmark_max" | "cap_minimum" | "cap_benchmark_min" | "cap_benchmark_max">, {
        by_user_id: ["userId", "_creationTime"];
    }, {}, {}>;
    subscriptions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        cancelAtPeriodEnd?: boolean | undefined;
        canceledAt?: number | undefined;
        createdAt: number;
        updatedAt: number;
        status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid";
        userId: string;
        stripeCustomerId: string;
        stripeSubscriptionId: string;
        planId: string;
        currentPeriodStart: number;
        currentPeriodEnd: number;
    }, {
        userId: import("convex/values").VString<string, "required">;
        stripeCustomerId: import("convex/values").VString<string, "required">;
        stripeSubscriptionId: import("convex/values").VString<string, "required">;
        planId: import("convex/values").VString<string, "required">;
        status: import("convex/values").VUnion<"active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid", [import("convex/values").VLiteral<"active", "required">, import("convex/values").VLiteral<"canceled", "required">, import("convex/values").VLiteral<"past_due", "required">, import("convex/values").VLiteral<"trialing", "required">, import("convex/values").VLiteral<"incomplete", "required">, import("convex/values").VLiteral<"incomplete_expired", "required">, import("convex/values").VLiteral<"unpaid", "required">], "required", never>;
        currentPeriodStart: import("convex/values").VFloat64<number, "required">;
        currentPeriodEnd: import("convex/values").VFloat64<number, "required">;
        cancelAtPeriodEnd: import("convex/values").VBoolean<boolean | undefined, "optional">;
        canceledAt: import("convex/values").VFloat64<number | undefined, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "updatedAt" | "status" | "userId" | "stripeCustomerId" | "stripeSubscriptionId" | "planId" | "currentPeriodStart" | "currentPeriodEnd" | "cancelAtPeriodEnd" | "canceledAt">, {
        by_user_id: ["userId", "_creationTime"];
        by_stripe_customer_id: ["stripeCustomerId", "_creationTime"];
        by_stripe_subscription_id: ["stripeSubscriptionId", "_creationTime"];
        by_status: ["status", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map