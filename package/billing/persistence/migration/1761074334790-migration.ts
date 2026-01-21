import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761074334790 implements MigrationInterface {
    name = 'Migration1761074334790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."AddOn_addontype_enum" AS ENUM('UHD4K', 'OfflineDownload', 'MultiDevice', 'FamilySharing')`);
        await queryRunner.query(`CREATE TABLE "AddOn" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying(100) NOT NULL, "description" text, "addOnType" "public"."AddOn_addontype_enum" NOT NULL, "price" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "requiresPlan" json, "isActive" boolean NOT NULL DEFAULT true, "taxCategoryId" character varying(255), "metadata" json, CONSTRAINT "PK_757b34def4bbc5a35057bc953ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "SubscriptionAddOn" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "subscriptionId" uuid NOT NULL, "addOnId" uuid NOT NULL, "startDate" TIMESTAMP NOT NULL DEFAULT now(), "endDate" TIMESTAMP, "quantity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_75376cd7fa930deeb0683854074" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Discount_discounttype_enum" AS ENUM('Percentage', 'FixedAmount', 'FirstMonths', 'Referral', 'Bundle')`);
        await queryRunner.query(`CREATE TABLE "Discount" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "discountType" "public"."Discount_discounttype_enum" NOT NULL, "value" numeric(10,2) NOT NULL, "maxRedemptions" integer, "currentRedemptions" integer NOT NULL DEFAULT '0', "validFrom" TIMESTAMP NOT NULL, "validTo" TIMESTAMP, "applicablePlans" json, "isStackable" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '0', "metadata" json, CONSTRAINT "UQ_5cb67063e80aca66ca30ae4eafa" UNIQUE ("code"), CONSTRAINT "PK_cc96b4ff4199e3766bb660d1157" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "SubscriptionDiscount" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "subscriptionId" uuid NOT NULL, "discountId" uuid NOT NULL, "appliedAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP, "remainingMonths" integer, CONSTRAINT "PK_d3d258c0aaa90d06e4656a552c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."InvoiceLineItem_chargetype_enum" AS ENUM('Subscription', 'Usage', 'AddOn', 'Proration', 'Tax', 'Discount')`);
        await queryRunner.query(`CREATE TYPE "public"."InvoiceLineItem_taxprovider_enum" AS ENUM('Standard', 'EasyTax', 'VatMoss')`);
        await queryRunner.query(`CREATE TABLE "InvoiceLineItem" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "invoiceId" uuid NOT NULL, "description" text NOT NULL, "chargeType" "public"."InvoiceLineItem_chargetype_enum" NOT NULL, "quantity" numeric(10,2) NOT NULL DEFAULT '0', "unitPrice" numeric(10,2) NOT NULL DEFAULT '0', "amount" numeric(10,2) NOT NULL DEFAULT '0', "taxAmount" numeric(10,2) NOT NULL DEFAULT '0', "taxRate" numeric(5,4) NOT NULL DEFAULT '0', "taxProvider" "public"."InvoiceLineItem_taxprovider_enum", "taxJurisdiction" character varying(255), "discountAmount" numeric(10,2) NOT NULL DEFAULT '0', "totalAmount" numeric(10,2) NOT NULL DEFAULT '0', "periodStart" TIMESTAMP, "periodEnd" TIMESTAMP, "prorationRate" numeric(5,4), "metadata" json, CONSTRAINT "PK_d462e9a1a4cfb2a746d9696b18b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Charge_chargetype_enum" AS ENUM('Subscription', 'Usage', 'AddOn', 'Proration', 'Tax', 'Discount')`);
        await queryRunner.query(`CREATE TYPE "public"."Charge_status_enum" AS ENUM('Pending', 'Succeeded', 'Failed', 'Refunded')`);
        await queryRunner.query(`CREATE TABLE "Charge" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" character varying NOT NULL, "subscriptionId" uuid NOT NULL, "invoiceId" uuid, "chargeType" "public"."Charge_chargetype_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "description" text NOT NULL, "taxAmount" numeric(10,2) NOT NULL DEFAULT '0', "status" "public"."Charge_status_enum" NOT NULL DEFAULT 'Pending', "failureReason" text, "metadata" json, CONSTRAINT "PK_0af294b521e6e781577aeabffc5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Payment_status_enum" AS ENUM('Pending', 'Succeeded', 'Failed', 'Refunded')`);
        await queryRunner.query(`CREATE TABLE "Payment" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "invoiceId" uuid NOT NULL, "userId" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "status" "public"."Payment_status_enum" NOT NULL DEFAULT 'Pending', "paymentMethod" character varying(100) NOT NULL, "failureReason" text, "transactionId" character varying(255), "processedAt" TIMESTAMP, "metadata" json, CONSTRAINT "PK_07e9fb9a8751923eb876d57a575" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Invoice_status_enum" AS ENUM('Draft', 'Open', 'Paid', 'Void', 'Uncollectible')`);
        await queryRunner.query(`CREATE TABLE "Invoice" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "invoiceNumber" character varying(100) NOT NULL, "userId" character varying NOT NULL, "subscriptionId" uuid NOT NULL, "status" "public"."Invoice_status_enum" NOT NULL DEFAULT 'Draft', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "totalTax" numeric(10,2) NOT NULL DEFAULT '0', "totalDiscount" numeric(10,2) NOT NULL DEFAULT '0', "totalCredit" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "amountDue" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'USD', "billingPeriodStart" TIMESTAMP NOT NULL, "billingPeriodEnd" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "paidAt" TIMESTAMP, CONSTRAINT "UQ_4afa3ebefec0ce2a8068fc1b838" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_0ead03cb5a20e5a5cc4d6defbe6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."UsageRecord_usagetype_enum" AS ENUM('StreamingHours', 'DownloadCount', 'Bandwidth4K', 'ApiCalls')`);
        await queryRunner.query(`CREATE TABLE "UsageRecord" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "subscriptionId" uuid NOT NULL, "usageType" "public"."UsageRecord_usagetype_enum" NOT NULL, "quantity" numeric(10,2) NOT NULL, "multiplier" numeric(5,2) NOT NULL DEFAULT '1', "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "billedInInvoiceId" character varying, CONSTRAINT "PK_05171d6ff97e09398997f83d425" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."DunningAttempt_stage_enum" AS ENUM('Retry1', 'Retry2', 'Retry3', 'Downgrade', 'Cancel')`);
        await queryRunner.query(`CREATE TYPE "public"."DunningAttempt_status_enum" AS ENUM('Pending', 'Succeeded', 'Failed', 'Refunded')`);
        await queryRunner.query(`CREATE TABLE "DunningAttempt" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "subscriptionId" uuid NOT NULL, "invoiceId" character varying NOT NULL, "stage" "public"."DunningAttempt_stage_enum" NOT NULL, "attemptNumber" integer NOT NULL, "attemptedAt" TIMESTAMP NOT NULL DEFAULT now(), "nextAttemptAt" TIMESTAMP, "status" "public"."DunningAttempt_status_enum" NOT NULL, "errorMessage" text, CONSTRAINT "PK_ee3c7f7ecfd09be41feeabc1c27" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "TaxRate" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying(100) NOT NULL, "country" character varying(2) NOT NULL, "state" character varying(50), "region" character varying(100) NOT NULL, "taxRate" numeric(5,4) NOT NULL, "useTaxRate" numeric(5,4) NOT NULL DEFAULT '0', "taxCategoryId" character varying(255) NOT NULL, "effectiveFrom" TIMESTAMP NOT NULL, "effectiveTo" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d7ab1f024d5a086e55cc43c8955" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Credit_credittype_enum" AS ENUM('Refund', 'Service', 'Promotional', 'Proration')`);
        await queryRunner.query(`CREATE TABLE "Credit" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" character varying NOT NULL, "creditType" "public"."Credit_credittype_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "remainingAmount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "description" text NOT NULL, "expiresAt" TIMESTAMP, "appliedToInvoiceId" character varying, "metadata" json, CONSTRAINT "PK_0259fe923620fe8d5b83efdfab7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."TaxCalculationSummary_taxprovider_enum" AS ENUM('Standard', 'EasyTax', 'VatMoss')`);
        await queryRunner.query(`CREATE TABLE "TaxCalculationSummary" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "invoiceLineId" character varying NOT NULL, "taxName" character varying(255) NOT NULL, "taxableAmount" numeric(10,2) NOT NULL, "taxAmount" numeric(10,2) NOT NULL, "taxRate" numeric(5,4) NOT NULL, "useTaxAmount" numeric(10,2), "useTaxRate" numeric(5,4), "jurisdiction" character varying(255) NOT NULL, "taxProvider" "public"."TaxCalculationSummary_taxprovider_enum" NOT NULL, CONSTRAINT "PK_76e841b8b8e96b9365fc0fae7a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."TaxCalculationError_taxprovider_enum" AS ENUM('Standard', 'EasyTax', 'VatMoss')`);
        await queryRunner.query(`CREATE TABLE "TaxCalculationError" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "invoiceId" character varying NOT NULL, "taxProvider" "public"."TaxCalculationError_taxprovider_enum" NOT NULL, "errorType" character varying(100) NOT NULL, "errorCode" character varying(50), "errorMessage" text NOT NULL, "traceId" character varying(100) NOT NULL, CONSTRAINT "PK_71e69c2814b4cea33ad3d588a6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Plan" ADD "taxCategoryId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "Plan" ADD "allowedAddOns" json`);
        await queryRunner.query(`ALTER TABLE "Plan" ADD "includedUsageQuotas" json`);
        await queryRunner.query(`ALTER TABLE "Plan" ADD "features" json`);
        await queryRunner.query(`ALTER TABLE "Plan" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "currentPeriodStart" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "currentPeriodEnd" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "canceledAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "trialEndsAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "billingAddress" json`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "taxRegionId" character varying`);
        await queryRunner.query(`ALTER TABLE "Subscription" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "SubscriptionAddOn" ADD CONSTRAINT "FK_6230b17cc19b4b2f0b7420345a7" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "SubscriptionAddOn" ADD CONSTRAINT "FK_a864ca62045f944b05bc1024094" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "SubscriptionDiscount" ADD CONSTRAINT "FK_898a07c54300e3db4435c181d31" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "SubscriptionDiscount" ADD CONSTRAINT "FK_be764312e8e5edb6e5a229dfe65" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "FK_03f0b5a1f1e85eff8dccaf778f9" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Charge" ADD CONSTRAINT "FK_af95d69dc791bd075c89d299c21" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Charge" ADD CONSTRAINT "FK_47b3f4350f81b043dbb61a0abfe" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Payment" ADD CONSTRAINT "FK_8635023386040e7449ecc1d2b5f" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "FK_0fb7645c2a566427c9757514cb5" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UsageRecord" ADD CONSTRAINT "FK_8755bb1ce35be7ca61a7f876b01" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "DunningAttempt" ADD CONSTRAINT "FK_0f08fdf9b8e5269b51e01bad6a1" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "DunningAttempt" DROP CONSTRAINT "FK_0f08fdf9b8e5269b51e01bad6a1"`);
        await queryRunner.query(`ALTER TABLE "UsageRecord" DROP CONSTRAINT "FK_8755bb1ce35be7ca61a7f876b01"`);
        await queryRunner.query(`ALTER TABLE "Invoice" DROP CONSTRAINT "FK_0fb7645c2a566427c9757514cb5"`);
        await queryRunner.query(`ALTER TABLE "Payment" DROP CONSTRAINT "FK_8635023386040e7449ecc1d2b5f"`);
        await queryRunner.query(`ALTER TABLE "Charge" DROP CONSTRAINT "FK_47b3f4350f81b043dbb61a0abfe"`);
        await queryRunner.query(`ALTER TABLE "Charge" DROP CONSTRAINT "FK_af95d69dc791bd075c89d299c21"`);
        await queryRunner.query(`ALTER TABLE "InvoiceLineItem" DROP CONSTRAINT "FK_03f0b5a1f1e85eff8dccaf778f9"`);
        await queryRunner.query(`ALTER TABLE "SubscriptionDiscount" DROP CONSTRAINT "FK_be764312e8e5edb6e5a229dfe65"`);
        await queryRunner.query(`ALTER TABLE "SubscriptionDiscount" DROP CONSTRAINT "FK_898a07c54300e3db4435c181d31"`);
        await queryRunner.query(`ALTER TABLE "SubscriptionAddOn" DROP CONSTRAINT "FK_a864ca62045f944b05bc1024094"`);
        await queryRunner.query(`ALTER TABLE "SubscriptionAddOn" DROP CONSTRAINT "FK_6230b17cc19b4b2f0b7420345a7"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "taxRegionId"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "billingAddress"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "trialEndsAt"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "cancelAtPeriodEnd"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "canceledAt"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "currentPeriodEnd"`);
        await queryRunner.query(`ALTER TABLE "Subscription" DROP COLUMN "currentPeriodStart"`);
        await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "features"`);
        await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "includedUsageQuotas"`);
        await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "allowedAddOns"`);
        await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "taxCategoryId"`);
        await queryRunner.query(`DROP TABLE "TaxCalculationError"`);
        await queryRunner.query(`DROP TYPE "public"."TaxCalculationError_taxprovider_enum"`);
        await queryRunner.query(`DROP TABLE "TaxCalculationSummary"`);
        await queryRunner.query(`DROP TYPE "public"."TaxCalculationSummary_taxprovider_enum"`);
        await queryRunner.query(`DROP TABLE "Credit"`);
        await queryRunner.query(`DROP TYPE "public"."Credit_credittype_enum"`);
        await queryRunner.query(`DROP TABLE "TaxRate"`);
        await queryRunner.query(`DROP TABLE "DunningAttempt"`);
        await queryRunner.query(`DROP TYPE "public"."DunningAttempt_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."DunningAttempt_stage_enum"`);
        await queryRunner.query(`DROP TABLE "UsageRecord"`);
        await queryRunner.query(`DROP TYPE "public"."UsageRecord_usagetype_enum"`);
        await queryRunner.query(`DROP TABLE "Invoice"`);
        await queryRunner.query(`DROP TYPE "public"."Invoice_status_enum"`);
        await queryRunner.query(`DROP TABLE "Payment"`);
        await queryRunner.query(`DROP TYPE "public"."Payment_status_enum"`);
        await queryRunner.query(`DROP TABLE "Charge"`);
        await queryRunner.query(`DROP TYPE "public"."Charge_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Charge_chargetype_enum"`);
        await queryRunner.query(`DROP TABLE "InvoiceLineItem"`);
        await queryRunner.query(`DROP TYPE "public"."InvoiceLineItem_taxprovider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."InvoiceLineItem_chargetype_enum"`);
        await queryRunner.query(`DROP TABLE "SubscriptionDiscount"`);
        await queryRunner.query(`DROP TABLE "Discount"`);
        await queryRunner.query(`DROP TYPE "public"."Discount_discounttype_enum"`);
        await queryRunner.query(`DROP TABLE "SubscriptionAddOn"`);
        await queryRunner.query(`DROP TABLE "AddOn"`);
        await queryRunner.query(`DROP TYPE "public"."AddOn_addontype_enum"`);
    }

}
