-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'paypal',
ADD COLUMN     "paypalEmail" TEXT,
ADD COLUMN     "routingNumber" TEXT;
