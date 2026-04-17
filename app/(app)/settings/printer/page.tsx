import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrinterForm } from "@/components/app/settings-forms";
import { SettingsBackLink } from "@/components/app/settings-back-link";
import { getSettingsData } from "@/lib/repository";

export default async function SettingsPrinterPage() {
  const data = await getSettingsData();

  return (
    <div className="space-y-6">
      <SettingsBackLink />
      <div>
        <h1 className="text-2xl font-semibold text-[#333]">Printer</h1>
        <p className="text-sm text-[#858585]">Receipt and KOT printers, plus receipt layout.</p>
      </div>
      <Card className="border-[#ebebeb] bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Printer</CardTitle>
        </CardHeader>
        <CardContent>
          <PrinterForm defaults={data.printer} />
        </CardContent>
      </Card>
    </div>
  );
}
