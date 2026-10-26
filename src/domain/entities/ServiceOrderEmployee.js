export class ServiceOrderEmployee {
    constructor({
        id,
        os_id,
        employee_id,
        employee_name
    }) {
        this.id = id;
        this.os_id = os_id;
        this.employee_id = employee_id;
        this.employee_name = employee_name;
    }

    // Converte o vínculo do funcionário para JSON
    toJSON() {
        return {
            id: this.id,
            os_id: this.os_id,
            employee_id: this.employee_id,
            employee_name: this.employee_name
        };
    }
}