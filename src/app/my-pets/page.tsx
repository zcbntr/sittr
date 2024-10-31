import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import PetsTable from "../_components/petstable";

const MyPetsPage = () => (
  <section>
    <div className="mt-4 flex w-full flex-row place-content-center">
      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
          <CardDescription>
            View and update the details for your pets here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <PetsTable />
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);

export default MyPetsPage;
