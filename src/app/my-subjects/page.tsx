import { Suspense } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import PetsTable from "../_components/petstable";

const MySubjectsPage = () => (
  <section>
    <div className="mt-4 flex w-full flex-row place-content-center">
      <Tabs defaultValue="pets" className="">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="houses">Houses</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
        </TabsList>
        <TabsContent value="pets">
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
        </TabsContent>
        <TabsContent value="houses">
          <Card>
            <CardHeader>
              <CardTitle>Houses</CardTitle>
              <CardDescription>
                View and update the details of your houses here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="current">Current houses</Label>
                <Input id="current" type="houses" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">New houses</Label>
                <Input id="new" type="houses" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save houses</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="plants">
          <Card>
            <CardHeader>
              <CardTitle>Plants</CardTitle>
              <CardDescription>
                View and update the details of your plants here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="current">Current plants</Label>
                <Input id="current" type="plants" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">New houses</Label>
                <Input id="new" type="plants" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save plants</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </section>
);

export default MySubjectsPage;
