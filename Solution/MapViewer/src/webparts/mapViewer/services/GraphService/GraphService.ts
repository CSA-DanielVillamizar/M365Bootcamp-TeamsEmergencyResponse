import IFieldMapper from '../../model/IFieldMapper';
import { IGraphService, IGraphServiceProps } from './IGraphService';
import IListItemsResponse from './GraphResponses/IListItemsResponse';
import ICreateListResponse from './GraphResponses/ICreateListResponse';
import { GraphError } from '@microsoft/microsoft-graph-client';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

export default class GraphService implements IGraphService {

    constructor(private serviceProps: IGraphServiceProps) { }

    // Get a list ID given a site ID and list name
    public async getListId(siteId: string, listName: string): Promise<string> {

        return new Promise<string>((resolve, reject) => {
            const query = this.serviceProps.graphClient
                .api(
                    `sites/${siteId}/lists/${listName}`
                )
                .select('id');
            query.get((error: GraphError, response: MicrosoftGraph.List) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response.id);
                }
            });
        });
    }

    // Get list items given a site ID and list ID. The specified mapper maps list
    // items to an array of T, allowing this function to be generic
    public async getListItems<T>(siteId: string, listId: string, mapper: IFieldMapper):
        Promise<T[]> {

        return new Promise<T[]>((resolve, reject) => {
            const query = this.serviceProps.graphClient
                .api(
                    `/sites/${siteId}/lists/${listId}/items`
                )
                .expand(
                    `fields($select%3D${mapper.getFieldNames()})`
                );

            query.get((error: GraphError, response: IListItemsResponse) => {
                if (error) {
                    reject(error);
                } else {
                    const result = mapper.getValuesFromFields(response.value);
                    resolve(result);
                }
            });
        });
    }

    // Set a list item
    public async updateListItem(siteId: string, listId: string, mapper: IFieldMapper,
        itemId: number, updates: any): Promise<void | string> {

        return new Promise<void | string>((resolve, reject) => {

            const query = this.serviceProps.graphClient
                .api(
                    `/sites/${siteId}/lists/${listId}/items/${itemId}`
                );

            const payload = mapper.setFields(updates);

            query.patch(payload, ((error: GraphError, response: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            }));
        });
    }

    public createList(siteId: string, listName: string, mapper: IFieldMapper):
        Promise<string> {

        return new Promise<string>((resolve, reject) => {

            const query = this.serviceProps.graphClient
                .api(
                    `/sites/${siteId}/lists/`
                );

            const payload = {
                displayName: listName,
                columns: mapper.getColumnDefinitions()
            };

            query.post(payload, ((error: GraphError, response: ICreateListResponse) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response.id);
                }
            }));
        });
    }
}