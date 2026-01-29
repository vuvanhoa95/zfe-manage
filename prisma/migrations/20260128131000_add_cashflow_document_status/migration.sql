-- Thêm trạng thái hồ sơ thanh toán cho từng dòng tiền
ALTER TABLE "cash_flows" ADD COLUMN "documentStatus" TEXT;
ALTER TABLE "cash_flows" ADD COLUMN "documentNote" TEXT;

