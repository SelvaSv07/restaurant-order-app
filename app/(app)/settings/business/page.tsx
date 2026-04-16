import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessForm } from "@/components/app/settings-forms";
import { SettingsBackLink } from "@/components/app/settings-back-link";
import { getSettingsData } from "@/lib/repository";

export default async function SettingsBusinessPage() {
  const data = await getSettingsData();

  return (
    <div className="space-y-6">
      <SettingsBackLink />
      <div>
        <h1 className="text-2xl font-semibold text-[#333]">Business</h1>
        <p className="text-sm text-[#858585]">Shop and tax details shown on bills.</p>
      </div>
      <Card className="border-[#ebebeb] bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Business details</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessForm defaults={data.business} />
        </CardContent>
      </Card>
    </div>
  );
}
