export class ServiceOrderEmployeePresenter {
    static toJSON(emp) {
        if (!emp) return null;
        return {
            id: emp.id,
            os_id: emp.os_id,
            employee_id: emp.employee_id,
            employee_name: emp.employee_name
        };
    }
}